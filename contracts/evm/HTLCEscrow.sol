// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HTLCEscrow
 * @dev Secure Hash Time-Locked Contract for cross-chain swaps
 * @notice Implements atomic transfers with hashlock and timelock guarantees
 * 
 * Security Features:
 * - Atomic fund transfer on escrow creation (no separate transfer step)
 * - Safety deposit mechanism for resolver misconduct
 * - Reentrancy protection
 * - Pausable for emergency stops
 * - Comprehensive event logging
 */
contract HTLCEscrow is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // ============================================
    // Structs and State Variables
    // ============================================

    struct Swap {
        address maker;           // User creating the swap
        address resolver;        // User fulfilling the swap
        address recipient;       // Final recipient of funds
        address token;           // Token contract address
        uint256 amount;          // Swap amount
        bytes32 hashlock;        // Hash of the secret (keccak256(preimage))
        uint256 timelock;        // Unix timestamp when swap expires
        uint256 safetyDeposit;   // Safety deposit from resolver
        bool redeemed;           // Whether swap has been redeemed
        bool refunded;           // Whether swap has been refunded
        uint256 createdAt;       // Block timestamp when swap was created
    }

    // Mapping from swap ID to swap data
    mapping(bytes32 => Swap) public swaps;
    
    // Safety deposit amount (in wei or token units)
    uint256 public safetyDepositAmount;
    
    // Minimum timelock duration (in seconds)
    uint256 public minTimelock;
    
    // Maximum timelock duration (in seconds)
    uint256 public maxTimelock;

    // ============================================
    // Events
    // ============================================

    event EscrowCreated(
        bytes32 indexed swapId,
        address indexed maker,
        address indexed resolver,
        address recipient,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        uint256 safetyDeposit
    );

    event Redeemed(
        bytes32 indexed swapId,
        address indexed redeemer,
        bytes32 preimage
    );

    event Refunded(
        bytes32 indexed swapId,
        address indexed refunder
    );

    event SafetyDepositClaimed(
        bytes32 indexed swapId,
        address indexed claimant,
        uint256 amount
    );

    event ParametersUpdated(
        uint256 safetyDepositAmount,
        uint256 minTimelock,
        uint256 maxTimelock
    );

    // ============================================
    // Constructor and Admin Functions
    // ============================================

    constructor(
        uint256 _safetyDepositAmount,
        uint256 _minTimelock,
        uint256 _maxTimelock
    ) {
        safetyDepositAmount = _safetyDepositAmount;
        minTimelock = _minTimelock;
        maxTimelock = _maxTimelock;
    }

    /**
     * @dev Update safety deposit and timelock parameters
     * @param _safetyDepositAmount New safety deposit amount
     * @param _minTimelock New minimum timelock duration
     * @param _maxTimelock New maximum timelock duration
     */
    function updateParameters(
        uint256 _safetyDepositAmount,
        uint256 _minTimelock,
        uint256 _maxTimelock
    ) external onlyOwner {
        require(_minTimelock <= _maxTimelock, "Invalid timelock range");
        
        safetyDepositAmount = _safetyDepositAmount;
        minTimelock = _minTimelock;
        maxTimelock = _maxTimelock;
        
        emit ParametersUpdated(_safetyDepositAmount, _minTimelock, _maxTimelock);
    }

    // ============================================
    // Core HTLC Functions
    // ============================================

    /**
     * @dev Create a new HTLC escrow with atomic fund transfer
     * @param swapId Unique identifier for the swap
     * @param maker Address of the user creating the swap
     * @param recipient Address to receive funds after redemption
     * @param token Token contract address
     * @param amount Amount of tokens to swap
     * @param hashlock Hash of the secret (keccak256(preimage))
     * @param timelock Unix timestamp when swap expires
     * 
     * Requirements:
     * - Maker must have approved this contract to spend tokens
     * - Timelock must be within allowed range
     * - Swap ID must be unique
     * - Resolver must send safety deposit as ETH
     */
    function createEscrow(
        bytes32 swapId,
        address maker,
        address recipient,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock
    ) external payable nonReentrant whenNotPaused {
        require(swaps[swapId].maker == address(0), "Swap already exists");
        require(maker != address(0), "Invalid maker");
        require(recipient != address(0), "Invalid recipient");
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be positive");
        require(timelock >= block.timestamp + minTimelock, "Timelock too short");
        require(timelock <= block.timestamp + maxTimelock, "Timelock too long");
        require(msg.value >= safetyDepositAmount, "Insufficient safety deposit");

        // Create swap record
        swaps[swapId] = Swap({
            maker: maker,
            resolver: msg.sender,
            recipient: recipient,
            token: token,
            amount: amount,
            hashlock: hashlock,
            timelock: timelock,
            safetyDeposit: msg.value,
            redeemed: false,
            refunded: false,
            createdAt: block.timestamp
        });

        // Atomic transfer: pull funds from maker to this contract
        IERC20(token).safeTransferFrom(maker, address(this), amount);

        emit EscrowCreated(
            swapId,
            maker,
            msg.sender,
            recipient,
            token,
            amount,
            hashlock,
            timelock,
            msg.value
        );
    }

    /**
     * @dev Redeem the swap by providing the correct preimage
     * @param swapId Unique identifier for the swap
     * @param preimage The secret that hashes to the hashlock
     * 
     * Requirements:
     * - Swap must exist and not be redeemed or refunded
     * - Preimage must hash to the correct hashlock
     * - Swap must not be expired
     */
    function redeem(bytes32 swapId, bytes32 preimage) external nonReentrant whenNotPaused {
        Swap storage swap = swaps[swapId];
        require(swap.maker != address(0), "Swap does not exist");
        require(!swap.redeemed, "Already redeemed");
        require(!swap.refunded, "Already refunded");
        require(block.timestamp <= swap.timelock, "Swap expired");
        require(keccak256(abi.encodePacked(preimage)) == swap.hashlock, "Invalid preimage");

        // Mark as redeemed
        swap.redeemed = true;

        // Transfer tokens to recipient
        IERC20(swap.token).safeTransfer(swap.recipient, swap.amount);

        // Return safety deposit to resolver
        if (swap.safetyDeposit > 0) {
            payable(swap.resolver).transfer(swap.safetyDeposit);
        }

        emit Redeemed(swapId, msg.sender, preimage);
    }

    /**
     * @dev Refund the swap after timelock expires
     * @param swapId Unique identifier for the swap
     * 
     * Requirements:
     * - Swap must exist and not be redeemed or refunded
     * - Swap must be expired (block.timestamp > timelock)
     * - Only maker or resolver can call this function
     */
    function refund(bytes32 swapId) external nonReentrant whenNotPaused {
        Swap storage swap = swaps[swapId];
        require(swap.maker != address(0), "Swap does not exist");
        require(!swap.redeemed, "Already redeemed");
        require(!swap.refunded, "Already refunded");
        require(block.timestamp > swap.timelock, "Swap not expired");
        require(
            msg.sender == swap.maker || msg.sender == swap.resolver,
            "Unauthorized"
        );

        // Mark as refunded
        swap.refunded = true;

        // Return tokens to maker
        IERC20(swap.token).safeTransfer(swap.maker, swap.amount);

        // Return safety deposit to resolver
        if (swap.safetyDeposit > 0) {
            payable(swap.resolver).transfer(swap.safetyDeposit);
        }

        emit Refunded(swapId, msg.sender);
    }

    /**
     * @dev Claim safety deposit when resolver fails to fulfill swap
     * @param swapId Unique identifier for the swap
     * 
     * Requirements:
     * - Swap must exist and be expired
     * - Swap must not be redeemed or refunded
     * - Only maker can claim safety deposit
     */
    function claimSafetyDeposit(bytes32 swapId) external nonReentrant whenNotPaused {
        Swap storage swap = swaps[swapId];
        require(swap.maker != address(0), "Swap does not exist");
        require(!swap.redeemed, "Already redeemed");
        require(!swap.refunded, "Already refunded");
        require(block.timestamp > swap.timelock, "Swap not expired");
        require(msg.sender == swap.maker, "Only maker can claim");

        uint256 depositAmount = swap.safetyDeposit;
        require(depositAmount > 0, "No safety deposit to claim");

        // Mark as refunded (safety deposit claimed)
        swap.refunded = true;

        // Return tokens to maker
        IERC20(swap.token).safeTransfer(swap.maker, swap.amount);

        // Send safety deposit to maker
        payable(swap.maker).transfer(depositAmount);

        emit SafetyDepositClaimed(swapId, msg.sender, depositAmount);
    }

    // ============================================
    // View Functions
    // ============================================

    /**
     * @dev Get swap details
     * @param swapId Unique identifier for the swap
     * @return swap Swap data struct
     */
    function getSwap(bytes32 swapId) external view returns (Swap memory) {
        return swaps[swapId];
    }

    /**
     * @dev Check if swap exists
     * @param swapId Unique identifier for the swap
     * @return exists True if swap exists
     */
    function swapExists(bytes32 swapId) external view returns (bool) {
        return swaps[swapId].maker != address(0);
    }

    /**
     * @dev Check if swap is expired
     * @param swapId Unique identifier for the swap
     * @return expired True if swap is expired
     */
    function isExpired(bytes32 swapId) external view returns (bool) {
        return block.timestamp > swaps[swapId].timelock;
    }

    // ============================================
    // Emergency Functions
    // ============================================

    /**
     * @dev Pause the contract in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal of stuck tokens (owner only)
     * @param token Token contract address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Emergency withdrawal of stuck ETH (owner only)
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawETH(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }

    // ============================================
    // Receive Function
    // ============================================

    /**
     * @dev Allow contract to receive ETH (for safety deposits)
     */
    receive() external payable {}
}
