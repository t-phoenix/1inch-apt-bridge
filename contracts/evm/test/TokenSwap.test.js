// Test file for TokenSwap contract
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenSwap", function () {
  let tokenSwap;
  let htlcEscrow;
  let mockToken;
  let owner;
  let user1;
  let user2;
  let oneInchRouter;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Test Token", "TEST", 18);
    await mockToken.waitForDeployment();

    // Deploy HTLCEscrow
    const HTLCEscrow = await ethers.getContractFactory("HTLCEscrow");
    htlcEscrow = await HTLCEscrow.deploy();
    await htlcEscrow.waitForDeployment();

    // Deploy mock 1inch router
    const MockRouter = await ethers.getContractFactory("Mock1InchRouter");
    oneInchRouter = await MockRouter.deploy();
    await oneInchRouter.waitForDeployment();

    // Deploy TokenSwap
    const TokenSwap = await ethers.getContractFactory("TokenSwap");
    tokenSwap = await TokenSwap.deploy(
      await oneInchRouter.getAddress(),
      await htlcEscrow.getAddress()
    );
    await tokenSwap.waitForDeployment();

    // Add owner as authorized caller
    await tokenSwap.setAuthorizedCaller(owner.address, true);
  });

  describe("Deployment", function () {
    it("Should set the correct 1inch router address", async function () {
      const contractInfo = await tokenSwap.getContractInfo();
      expect(contractInfo.router).to.equal(await oneInchRouter.getAddress());
    });

    it("Should set the correct HTLC escrow address", async function () {
      const contractInfo = await tokenSwap.getContractInfo();
      expect(contractInfo.escrow).to.equal(await htlcEscrow.getAddress());
    });

    it("Should set owner as authorized caller", async function () {
      expect(await tokenSwap.authorizedCallers(owner.address)).to.be.true;
    });
  });

  describe("Authorization", function () {
    it("Should allow authorized caller to execute swap", async function () {
      const swapId = ethers.keccak256(ethers.toUtf8Bytes("test-swap-1"));
      const fromToken = await mockToken.getAddress();
      const toToken = await mockToken.getAddress();
      const amount = ethers.parseEther("1");
      const minReturnAmount = ethers.parseEther("0.99");
      const slippage = 100; // 1%
      const swapData = "0x"; // Mock swap data

      // Mint tokens to HTLC escrow
      await mockToken.mint(await htlcEscrow.getAddress(), amount);

      // Execute swap
      await expect(
        tokenSwap.executeSwap(
          swapId,
          fromToken,
          toToken,
          amount,
          minReturnAmount,
          slippage,
          swapData
        )
      ).to.not.be.reverted;
    });

    it("Should reject unauthorized caller", async function () {
      const swapId = ethers.keccak256(ethers.toUtf8Bytes("test-swap-2"));
      const fromToken = await mockToken.getAddress();
      const toToken = await mockToken.getAddress();
      const amount = ethers.parseEther("1");
      const minReturnAmount = ethers.parseEther("0.99");
      const slippage = 100;
      const swapData = "0x";

      await expect(
        tokenSwap.connect(user1).executeSwap(
          swapId,
          fromToken,
          toToken,
          amount,
          minReturnAmount,
          slippage,
          swapData
        )
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Swap Execution", function () {
    it("Should execute swap successfully", async function () {
      const swapId = ethers.keccak256(ethers.toUtf8Bytes("test-swap-3"));
      const fromToken = await mockToken.getAddress();
      const toToken = await mockToken.getAddress();
      const amount = ethers.parseEther("1");
      const minReturnAmount = ethers.parseEther("0.99");
      const slippage = 100;
      const swapData = "0x";

      // Mint tokens to HTLC escrow
      await mockToken.mint(await htlcEscrow.getAddress(), amount);

      // Execute swap
      await tokenSwap.executeSwap(
        swapId,
        fromToken,
        toToken,
        amount,
        minReturnAmount,
        slippage,
        swapData
      );

      // Check if swap is marked as executed
      expect(await tokenSwap.isSwapExecuted(swapId)).to.be.true;
    });

    it("Should prevent duplicate swap execution", async function () {
      const swapId = ethers.keccak256(ethers.toUtf8Bytes("test-swap-4"));
      const fromToken = await mockToken.getAddress();
      const toToken = await mockToken.getAddress();
      const amount = ethers.parseEther("1");
      const minReturnAmount = ethers.parseEther("0.99");
      const slippage = 100;
      const swapData = "0x";

      // Mint tokens to HTLC escrow
      await mockToken.mint(await htlcEscrow.getAddress(), amount);

      // Execute swap first time
      await tokenSwap.executeSwap(
        swapId,
        fromToken,
        toToken,
        amount,
        minReturnAmount,
        slippage,
        swapData
      );

      // Try to execute same swap again
      await expect(
        tokenSwap.executeSwap(
          swapId,
          fromToken,
          toToken,
          amount,
          minReturnAmount,
          slippage,
          swapData
        )
      ).to.be.revertedWith("Swap already executed");
    });
  });

  describe("Slippage Validation", function () {
    it("Should accept valid slippage", async function () {
      const swapId = ethers.keccak256(ethers.toUtf8Bytes("test-swap-5"));
      const fromToken = await mockToken.getAddress();
      const toToken = await mockToken.getAddress();
      const amount = ethers.parseEther("1");
      const minReturnAmount = ethers.parseEther("0.99");
      const slippage = 100; // 1%
      const swapData = "0x";

      await mockToken.mint(await htlcEscrow.getAddress(), amount);

      await expect(
        tokenSwap.executeSwap(
          swapId,
          fromToken,
          toToken,
          amount,
          minReturnAmount,
          slippage,
          swapData
        )
      ).to.not.be.reverted;
    });

    it("Should reject invalid slippage", async function () {
      const swapId = ethers.keccak256(ethers.toUtf8Bytes("test-swap-6"));
      const fromToken = await mockToken.getAddress();
      const toToken = await mockToken.getAddress();
      const amount = ethers.parseEther("1");
      const minReturnAmount = ethers.parseEther("0.99");
      const slippage = 6000; // 60% - too high
      const swapData = "0x";

      await expect(
        tokenSwap.executeSwap(
          swapId,
          fromToken,
          toToken,
          amount,
          minReturnAmount,
          slippage,
          swapData
        )
      ).to.be.revertedWith("Invalid slippage");
    });
  });

  describe("ETH Swaps", function () {
    it("Should execute ETH swap", async function () {
      const swapId = ethers.keccak256(ethers.toUtf8Bytes("test-swap-7"));
      const toToken = await mockToken.getAddress();
      const minReturnAmount = ethers.parseEther("0.99");
      const slippage = 100;
      const swapData = "0x";
      const ethAmount = ethers.parseEther("1");

      await expect(
        tokenSwap.executeSwapETH(
          swapId,
          toToken,
          minReturnAmount,
          slippage,
          swapData,
          { value: ethAmount }
        )
      ).to.not.be.reverted;
    });
  });

  describe("Admin Functions", function () {
    it("Should update router address", async function () {
      const newRouter = user1.address;
      
      await tokenSwap.updateRouter(newRouter);
      
      const contractInfo = await tokenSwap.getContractInfo();
      expect(contractInfo.router).to.equal(newRouter);
    });

    it("Should add/remove authorized callers", async function () {
      // Add user1 as authorized
      await tokenSwap.setAuthorizedCaller(user1.address, true);
      expect(await tokenSwap.authorizedCallers(user1.address)).to.be.true;

      // Remove user1 authorization
      await tokenSwap.setAuthorizedCaller(user1.address, false);
      expect(await tokenSwap.authorizedCallers(user1.address)).to.be.false;
    });

    it("Should only allow owner to update router", async function () {
      const newRouter = user1.address;
      
      await expect(
        tokenSwap.connect(user1).updateRouter(newRouter)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to recover tokens", async function () {
      // Mint some tokens to the contract
      await mockToken.mint(await tokenSwap.getAddress(), ethers.parseEther("1"));
      
      const balanceBefore = await mockToken.balanceOf(owner.address);
      
      // Recover tokens
      await tokenSwap.emergencyRecover(await mockToken.getAddress(), ethers.parseEther("1"));
      
      const balanceAfter = await mockToken.balanceOf(owner.address);
      expect(balanceAfter).to.equal(balanceBefore + ethers.parseEther("1"));
    });

    it("Should allow owner to recover ETH", async function () {
      // Send some ETH to the contract
      await user1.sendTransaction({
        to: await tokenSwap.getAddress(),
        value: ethers.parseEther("1")
      });
      
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      
      // Recover ETH
      await tokenSwap.emergencyRecover(ethers.ZeroAddress, ethers.parseEther("1"));
      
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });
  });

  describe("View Functions", function () {
    it("Should return correct balance", async function () {
      // Mint some tokens to the contract
      await mockToken.mint(await tokenSwap.getAddress(), ethers.parseEther("1"));
      
      const balance = await tokenSwap.getBalance(await mockToken.getAddress());
      expect(balance).to.equal(ethers.parseEther("1"));
    });

    it("Should return correct ETH balance", async function () {
      // Send some ETH to the contract
      await user1.sendTransaction({
        to: await tokenSwap.getAddress(),
        value: ethers.parseEther("1")
      });
      
      const balance = await tokenSwap.getBalance(ethers.ZeroAddress);
      expect(balance).to.equal(ethers.parseEther("1"));
    });
  });
});
