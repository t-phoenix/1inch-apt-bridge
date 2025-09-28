const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Resolver", function () {
    let Resolver;
    let resolver;
    let owner;
    let maker;
    let mockLop;
    let mockFactory;
    let mockToken;

    // Helper to extract the core fields of an Order struct from the Solidity Order type
    const getOrderStruct = (order) => ({
        salt: order.salt.toString(),
        maker: order.maker.toString(),
        receiver: order.receiver.toString(),
        makerAsset: order.makerAsset.toString(),
        takerAsset: order.takerAsset.toString(),
        makingAmount: order.makingAmount.toString(),
        takingAmount: order.takingAmount.toString(),
        makerTraits: order.makerTraits.toString(),
    });

    before(async function () {
        [owner, maker, mockLop, mockFactory, mockToken] = await ethers.getSigners();

        // Deploy the Resolver contract
        Resolver = await ethers.getContractFactory("Resolver");
        resolver = await Resolver.deploy(
            mockLop.address,
            mockFactory.address,
            owner.address
        );
        await resolver.waitForDeployment();
    });

    // --- Utility Method Tests ---

    describe("Utility Methods", function () {
        it("Should correctly generate default Timelocks", async function () {
            // Values from the code: srcWithdrawalDelay, srcPublicWithdrawalDelay, srcCancellationDelay, srcPublicCancellationDelay, dstWithdrawalDelay, dstPublicWithdrawalDelay, dstCancellationDelay
            const timelocks = await resolver.getDefaultTimelock(
                100, 200, 300, 400, 500, 600, 700
            );

            // In Solidity: (uint(A) | (uint(B) << 32) | (uint(C) << 64) | (uint(D) << 96) | (uint(E) << 128) | (uint(F) << 160) | (uint(G) << 192))
            // The expected value is a single large number (uint256 wrapped in Timelocks)
            const expected = ethers.getBigInt(100)                                     // A
                .or(ethers.getBigInt(200).shl(32))                                     // B
                .or(ethers.getBigInt(300).shl(64))                                     // C
                .or(ethers.getBigInt(400).shl(96))                                     // D
                .or(ethers.getBigInt(500).shl(128))                                    // E
                .or(ethers.getBigInt(600).shl(160))                                    // F
                .or(ethers.getBigInt(700).shl(192));                                   // G

            // Use the unwrap function to check the internal value
            const unwrappedTimelock = await resolver.callStatic.getExtraDataArgs(ethers.constants.HashZero, timelocks).then(args => args.timelocks);
            expect(unwrappedTimelock).to.equal(expected);
        });

        it("Should correctly generate ExtraDataArgs", async function () {
            const hashlockInfo = ethers.utils.id("test-hashlock");
            const timelocks = await resolver.getDefaultTimelock(1, 1, 1, 1, 1, 1, 1);
            
            const extraDataArgs = await resolver.getExtraDataArgs(hashlockInfo, timelocks);

            expect(extraDataArgs.hashlockInfo).to.equal(hashlockInfo);
            expect(extraDataArgs.dstChainId).to.equal(0);
            // expect(extraDataArgs.dstToken).to.equal(ethers.constants.AddressZero); // Address is wrapped in Address type (uint160(0))
            expect(extraDataArgs.deposits).to.equal(0);
            // expect(extraDataArgs.timelocks).to.equal(timelocks);
        });

        it("Should correctly generate Extensions (abi.encodePacked)", async function () {
            const extraDataArgs = await resolver.getExtraDataArgs(ethers.constants.HashZero, ethers.constants.Zero);
            const mockPermit = "0x11223344";

            const extensions = await resolver.getExtensions(extraDataArgs, mockPermit);
            
            // Check that the output is non-empty
            expect(extensions.length).to.be.greaterThan(2);

            // A very rough structural check: it should contain the factory address and the permit data
            expect(extensions).to.include(mockFactory.address.substring(2).toLowerCase()); // Check factory address presence
            expect(extensions).to.include(mockPermit.substring(2)); // Check permit data presence
        });
    });

    // --- Order Generation Test ---

    describe("Order Generation", function () {
        it("Should correctly generate an IOrderMixin.Order struct", async function () {
            const extensionsHash = ethers.utils.id("test-extension-hash");
            const makerAsset = mockToken.address;
            const takerAsset = maker.address; // Using maker as mockTakerToken
            const makeAmount = ethers.parseEther("100");
            
            // Generate the order using the Resolver's utility function
            const order = await resolver.getOrder(
                extensionsHash,
                maker.address,
                makerAsset,
                takerAsset,
                makeAmount
            );

            // Check the core fields
            expect(order.salt).to.equal(ethers.getBigInt(extensionsHash.substring(0, 42))); // Salt is derived from extensionHash
            expect(order.maker.toString()).to.equal(maker.address);
            expect(order.receiver.toString()).to.equal(resolver.target); // The receiver is the resolver contract
            expect(order.makerAsset.toString()).to.equal(makerAsset);
            expect(order.takerAsset.toString()).to.equal(takerAsset);
            expect(order.makingAmount).to.equal(makeAmount);
            expect(order.takingAmount).to.equal(0);
            
            // Check MakerTraits: newMakerTraits(address(0), block.timestamp + 10000, false, true, _nonces[maker])
            // It should have the HAS_EXTENSION_FLAG (1 << 249) set and POST_INTERACTION_CALL_FLAG (1 << 251) set
            // And NO_PARTIAL_FILLS_FLAG (1 << 255) set since allowPartialFills_ is false
            const MAKER_TRAITS_FLAGS = ethers.getBigInt(1).shl(251) // POST_INTERACTION_CALL_FLAG
                .or(ethers.getBigInt(1).shl(249)) // HAS_EXTENSION_FLAG
                .or(ethers.getBigInt(1).shl(255)); // NO_PARTIAL_FILLS_FLAG
            
            // The makerTraits value is complex, but checking the flags provides a good check on the default settings
            expect(order.makerTraits.toBigInt() & MAKER_TRAITS_FLAGS).to.equal(MAKER_TRAITS_FLAGS);
        });
    });

    // --- Deploy Src Test (High-level integration test) ---

    describe("Deployment Logic (deploySrc)", function () {
        it("Should revert if not called by the owner", async function () {
            const [, nonOwner] = await ethers.getSigners();
            const order = { // Mock minimal order struct
                salt: ethers.getBigInt(123),
                maker: maker.address,
                receiver: resolver.target,
                makerAsset: mockToken.address,
                takerAsset: mockLop.address,
                makingAmount: 1,
                takingAmount: 0,
                makerTraits: 0
            };
            const immutables = { // Mock Immutables struct
                orderHash: ethers.constants.HashZero,
                hashlock: ethers.constants.HashZero,
                maker: maker.address,
                taker: resolver.target,
                token: mockToken.address,
                amount: 1,
                safetyDeposit: 0,
                timelocks: 0
            };
            const extraDataArgs = { // Mock ExtraDataArgs
                hashlockInfo: ethers.constants.HashZero,
                dstChainId: 0,
                dstToken: maker.address,
                deposits: 0,
                timelocks: 0
            };

            await expect(
                resolver.connect(nonOwner).deploySrc(
                    order, 27, ethers.constants.HashZero, ethers.constants.HashZero, 
                    immutables, 1, "0x", extraDataArgs
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        
        // Note: A full functional test of deploySrc requires mocking the LOP (IOrderMixin) and Factory (IEscrowFactory), 
        // which is complex. The above tests check the utility functions used by deploySrc, 
        // which is the main contribution of this mock resolver.
    });
});