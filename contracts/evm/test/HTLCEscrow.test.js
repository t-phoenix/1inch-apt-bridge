const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("HTLCEscrow", function () {
  let htlcEscrow;
  let token;
  let owner;
  let maker;
  let resolver;
  let recipient;
  let other;

  const SAFETY_DEPOSIT = ethers.utils.parseEther("0.1");
  const MIN_TIMELOCK = 3600; // 1 hour
  const MAX_TIMELOCK = 86400 * 7; // 7 days
  const SWAP_AMOUNT = ethers.utils.parseEther("100");

  beforeEach(async function () {
    [owner, maker, resolver, recipient, other] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const Token = await ethers.getContractFactory("MockERC20");
    token = await Token.deploy("Test Token", "TEST", ethers.utils.parseEther("1000000"));
    await token.deployed();

    // Deploy HTLCEscrow
    const HTLCEscrow = await ethers.getContractFactory("HTLCEscrow");
    htlcEscrow = await HTLCEscrow.deploy(
      SAFETY_DEPOSIT,
      MIN_TIMELOCK,
      MAX_TIMELOCK
    );
    await htlcEscrow.deployed();

    // Transfer tokens to maker
    await token.transfer(maker.address, SWAP_AMOUNT.mul(2));
  });

  describe("Deployment", function () {
    it("Should set correct initial parameters", async function () {
      expect(await htlcEscrow.safetyDepositAmount()).to.equal(SAFETY_DEPOSIT);
      expect(await htlcEscrow.minTimelock()).to.equal(MIN_TIMELOCK);
      expect(await htlcEscrow.maxTimelock()).to.equal(MAX_TIMELOCK);
      expect(await htlcEscrow.owner()).to.equal(owner.address);
    });
  });

  describe("createEscrow", function () {
    let swapId;
    let hashlock;
    let timelock;

    beforeEach(async function () {
      swapId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-swap"));
      hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("secret"));
      timelock = (await time.latest()) + MIN_TIMELOCK + 1;

      // Approve tokens
      await token.connect(maker).approve(htlcEscrow.address, SWAP_AMOUNT);
    });

    it("Should create escrow successfully", async function () {
      await expect(
        htlcEscrow.connect(resolver).createEscrow(
          swapId,
          maker.address,
          recipient.address,
          token.address,
          SWAP_AMOUNT,
          hashlock,
          timelock,
          { value: SAFETY_DEPOSIT }
        )
      ).to.emit(htlcEscrow, "EscrowCreated");

      const swap = await htlcEscrow.getSwap(swapId);
      expect(swap.maker).to.equal(maker.address);
      expect(swap.resolver).to.equal(resolver.address);
      expect(swap.recipient).to.equal(recipient.address);
      expect(swap.token).to.equal(token.address);
      expect(swap.amount).to.equal(SWAP_AMOUNT);
      expect(swap.hashlock).to.equal(hashlock);
      expect(swap.timelock).to.equal(timelock);
      expect(swap.safetyDeposit).to.equal(SAFETY_DEPOSIT);
      expect(swap.redeemed).to.be.false;
      expect(swap.refunded).to.be.false;
    });

    it("Should transfer tokens atomically", async function () {
      const makerBalanceBefore = await token.balanceOf(maker.address);
      const contractBalanceBefore = await token.balanceOf(htlcEscrow.address);

      await htlcEscrow.connect(resolver).createEscrow(
        swapId,
        maker.address,
        recipient.address,
        token.address,
        SWAP_AMOUNT,
        hashlock,
        timelock,
        { value: SAFETY_DEPOSIT }
      );

      expect(await token.balanceOf(maker.address)).to.equal(
        makerBalanceBefore.sub(SWAP_AMOUNT)
      );
      expect(await token.balanceOf(htlcEscrow.address)).to.equal(
        contractBalanceBefore.add(SWAP_AMOUNT)
      );
    });

    it("Should fail with insufficient safety deposit", async function () {
      await expect(
        htlcEscrow.connect(resolver).createEscrow(
          swapId,
          maker.address,
          recipient.address,
          token.address,
          SWAP_AMOUNT,
          hashlock,
          timelock,
          { value: SAFETY_DEPOSIT.sub(1) }
        )
      ).to.be.revertedWith("Insufficient safety deposit");
    });

    it("Should fail with insufficient token allowance", async function () {
      await token.connect(maker).approve(htlcEscrow.address, SWAP_AMOUNT.sub(1));

      await expect(
        htlcEscrow.connect(resolver).createEscrow(
          swapId,
          maker.address,
          recipient.address,
          token.address,
          SWAP_AMOUNT,
          hashlock,
          timelock,
          { value: SAFETY_DEPOSIT }
        )
      ).to.be.reverted;
    });

    it("Should fail with duplicate swap ID", async function () {
      await htlcEscrow.connect(resolver).createEscrow(
        swapId,
        maker.address,
        recipient.address,
        token.address,
        SWAP_AMOUNT,
        hashlock,
        timelock,
        { value: SAFETY_DEPOSIT }
      );

      await expect(
        htlcEscrow.connect(resolver).createEscrow(
          swapId,
          maker.address,
          recipient.address,
          token.address,
          SWAP_AMOUNT,
          hashlock,
          timelock,
          { value: SAFETY_DEPOSIT }
        )
      ).to.be.revertedWith("Swap already exists");
    });

    it("Should fail with timelock too short", async function () {
      const shortTimelock = (await time.latest()) + MIN_TIMELOCK - 1;

      await expect(
        htlcEscrow.connect(resolver).createEscrow(
          swapId,
          maker.address,
          recipient.address,
          token.address,
          SWAP_AMOUNT,
          hashlock,
          shortTimelock,
          { value: SAFETY_DEPOSIT }
        )
      ).to.be.revertedWith("Timelock too short");
    });

    it("Should fail with timelock too long", async function () {
      const longTimelock = (await time.latest()) + MAX_TIMELOCK + 1;

      await expect(
        htlcEscrow.connect(resolver).createEscrow(
          swapId,
          maker.address,
          recipient.address,
          token.address,
          SWAP_AMOUNT,
          hashlock,
          longTimelock,
          { value: SAFETY_DEPOSIT }
        )
      ).to.be.revertedWith("Timelock too long");
    });
  });

  describe("redeem", function () {
    let swapId;
    let hashlock;
    let timelock;
    let preimage;

    beforeEach(async function () {
      swapId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-swap"));
      preimage = ethers.utils.toUtf8Bytes("secret");
      hashlock = ethers.utils.keccak256(preimage);
      timelock = (await time.latest()) + MIN_TIMELOCK + 1;

      await token.connect(maker).approve(htlcEscrow.address, SWAP_AMOUNT);
      await htlcEscrow.connect(resolver).createEscrow(
        swapId,
        maker.address,
        recipient.address,
        token.address,
        SWAP_AMOUNT,
        hashlock,
        timelock,
        { value: SAFETY_DEPOSIT }
      );
    });

    it("Should redeem successfully", async function () {
      const recipientBalanceBefore = await token.balanceOf(recipient.address);
      const resolverBalanceBefore = await ethers.provider.getBalance(resolver.address);

      await expect(
        htlcEscrow.connect(other).redeem(swapId, hashlock)
      ).to.emit(htlcEscrow, "Redeemed");

      expect(await token.balanceOf(recipient.address)).to.equal(
        recipientBalanceBefore.add(SWAP_AMOUNT)
      );

      // Check safety deposit is returned
      const resolverBalanceAfter = await ethers.provider.getBalance(resolver.address);
      expect(resolverBalanceAfter).to.be.closeTo(
        resolverBalanceBefore.add(SAFETY_DEPOSIT),
        ethers.utils.parseEther("0.01") // Gas cost tolerance
      );

      const swap = await htlcEscrow.getSwap(swapId);
      expect(swap.redeemed).to.be.true;
    });

    it("Should fail with invalid preimage", async function () {
      const invalidPreimage = ethers.utils.toUtf8Bytes("wrong-secret");

      await expect(
        htlcEscrow.connect(other).redeem(swapId, invalidPreimage)
      ).to.be.revertedWith("Invalid preimage");
    });

    it("Should fail when expired", async function () {
      await time.increase(MIN_TIMELOCK + 2);

      await expect(
        htlcEscrow.connect(other).redeem(swapId, hashlock)
      ).to.be.revertedWith("Swap expired");
    });

    it("Should fail when already redeemed", async function () {
      await htlcEscrow.connect(other).redeem(swapId, hashlock);

      await expect(
        htlcEscrow.connect(other).redeem(swapId, hashlock)
      ).to.be.revertedWith("Already redeemed");
    });
  });

  describe("refund", function () {
    let swapId;
    let hashlock;
    let timelock;

    beforeEach(async function () {
      swapId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-swap"));
      hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("secret"));
      timelock = (await time.latest()) + MIN_TIMELOCK + 1;

      await token.connect(maker).approve(htlcEscrow.address, SWAP_AMOUNT);
      await htlcEscrow.connect(resolver).createEscrow(
        swapId,
        maker.address,
        recipient.address,
        token.address,
        SWAP_AMOUNT,
        hashlock,
        timelock,
        { value: SAFETY_DEPOSIT }
      );
    });

    it("Should refund successfully after expiry", async function () {
      await time.increase(MIN_TIMELOCK + 2);

      const makerBalanceBefore = await token.balanceOf(maker.address);
      const resolverBalanceBefore = await ethers.provider.getBalance(resolver.address);

      await expect(
        htlcEscrow.connect(maker).refund(swapId)
      ).to.emit(htlcEscrow, "Refunded");

      expect(await token.balanceOf(maker.address)).to.equal(
        makerBalanceBefore.add(SWAP_AMOUNT)
      );

      // Check safety deposit is returned to resolver
      const resolverBalanceAfter = await ethers.provider.getBalance(resolver.address);
      expect(resolverBalanceAfter).to.be.closeTo(
        resolverBalanceBefore.add(SAFETY_DEPOSIT),
        ethers.utils.parseEther("0.01")
      );

      const swap = await htlcEscrow.getSwap(swapId);
      expect(swap.refunded).to.be.true;
    });

    it("Should fail when not expired", async function () {
      await expect(
        htlcEscrow.connect(maker).refund(swapId)
      ).to.be.revertedWith("Swap not expired");
    });

    it("Should fail when unauthorized", async function () {
      await time.increase(MIN_TIMELOCK + 2);

      await expect(
        htlcEscrow.connect(other).refund(swapId)
      ).to.be.revertedWith("Unauthorized");
    });
  });

  describe("claimSafetyDeposit", function () {
    let swapId;
    let hashlock;
    let timelock;

    beforeEach(async function () {
      swapId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-swap"));
      hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("secret"));
      timelock = (await time.latest()) + MIN_TIMELOCK + 1;

      await token.connect(maker).approve(htlcEscrow.address, SWAP_AMOUNT);
      await htlcEscrow.connect(resolver).createEscrow(
        swapId,
        maker.address,
        recipient.address,
        token.address,
        SWAP_AMOUNT,
        hashlock,
        timelock,
        { value: SAFETY_DEPOSIT }
      );
    });

    it("Should claim safety deposit when resolver fails", async function () {
      await time.increase(MIN_TIMELOCK + 2);

      const makerBalanceBefore = await ethers.provider.getBalance(maker.address);
      const makerTokenBalanceBefore = await token.balanceOf(maker.address);

      await expect(
        htlcEscrow.connect(maker).claimSafetyDeposit(swapId)
      ).to.emit(htlcEscrow, "SafetyDepositClaimed");

      expect(await token.balanceOf(maker.address)).to.equal(
        makerTokenBalanceBefore.add(SWAP_AMOUNT)
      );

      // Check safety deposit is sent to maker
      const makerBalanceAfter = await ethers.provider.getBalance(maker.address);
      expect(makerBalanceAfter).to.be.closeTo(
        makerBalanceBefore.add(SAFETY_DEPOSIT),
        ethers.utils.parseEther("0.01")
      );

      const swap = await htlcEscrow.getSwap(swapId);
      expect(swap.refunded).to.be.true;
    });

    it("Should fail when not expired", async function () {
      await expect(
        htlcEscrow.connect(maker).claimSafetyDeposit(swapId)
      ).to.be.revertedWith("Swap not expired");
    });

    it("Should fail when not maker", async function () {
      await time.increase(MIN_TIMELOCK + 2);

      await expect(
        htlcEscrow.connect(other).claimSafetyDeposit(swapId)
      ).to.be.revertedWith("Only maker can claim");
    });
  });

  describe("Admin functions", function () {
    it("Should update parameters", async function () {
      const newSafetyDeposit = ethers.utils.parseEther("0.2");
      const newMinTimelock = 7200;
      const newMaxTimelock = 86400 * 14;

      await expect(
        htlcEscrow.updateParameters(newSafetyDeposit, newMinTimelock, newMaxTimelock)
      ).to.emit(htlcEscrow, "ParametersUpdated");

      expect(await htlcEscrow.safetyDepositAmount()).to.equal(newSafetyDeposit);
      expect(await htlcEscrow.minTimelock()).to.equal(newMinTimelock);
      expect(await htlcEscrow.maxTimelock()).to.equal(newMaxTimelock);
    });

    it("Should pause and unpause", async function () {
      await htlcEscrow.pause();
      expect(await htlcEscrow.paused()).to.be.true;

      await htlcEscrow.unpause();
      expect(await htlcEscrow.paused()).to.be.false;
    });
  });
});
