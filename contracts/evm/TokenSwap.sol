// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./HTLCEscrow.sol";

/**
 * @title TokenSwap
 * @dev Contract for executing token swaps with 1inch integration
 * @notice This contract handles the actual token swapping logic using 1inch protocol
 */
contract TokenSwap is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Events
    event SwapExecuted(
        bytes32 indexed swapId,
        address indexed user,
        address fromToken,
        address toToken,
        uint256 fromAmount,
        uint256 toAmount,
        uint256 timestamp
    );

    event SwapFailed(
        bytes32 indexed swapId,
        address indexed user,
        string reason,
        uint256 timestamp
    );

    event RouterUpdated(
        address indexed oldRouter,
        address indexed newRouter,
        uint256 timestamp
    );

    // State variables
    address public oneInchRouter;
    address public htlcEscrow;
    mapping(bytes32 => bool) public executedSwaps;
    mapping(address => bool) public authorizedCallers;

    // Constants
    uint256 public constant MAX_SLIPPAGE = 5000; // 50%
    uint256 public constant MIN_SLIPPAGE = 1; // 0.01%
    uint256 public constant DEADLINE_BUFFER = 300; // 5 minutes

    // Modifiers
    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    modifier validSlippage(uint256 slippage) {
        require(slippage >= MIN_SLIPPAGE && slippage <= MAX_SLIPPAGE, "Invalid slippage");
        _;
    }

    modifier swapNotExecuted(bytes32 swapId) {
        require(!executedSwaps[swapId], "Swap already executed");
        _;
    }

    constructor(address _oneInchRouter, address _htlcEscrow) {
        require(_oneInchRouter != address(0), "Invalid 1inch router");
        require(_htlcEscrow != address(0), "Invalid HTLC escrow");
        
        oneInchRouter = _oneInchRouter;
        htlcEscrow = _htlcEscrow;
        authorizedCallers[msg.sender] = true;
    }

    /**
     * @dev Execute a token swap using 1inch protocol
     * @param swapId Unique identifier for the swap
     * @param fromToken Address of the token to swap from
     * @param toToken Address of the token to swap to
     * @param amount Amount of fromToken to swap
     * @param minReturnAmount Minimum amount of toToken expected
     * @param slippage Slippage tolerance in basis points (1 = 0.01%)
     * @param swapData 1inch swap data
     */
    function executeSwap(
        bytes32 swapId,
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 minReturnAmount,
        uint256 slippage,
        bytes calldata swapData
    ) external 
        nonReentrant 
        onlyAuthorized 
        validSlippage(slippage)
        swapNotExecuted(swapId)
    {
        require(fromToken != address(0), "Invalid from token");
        require(toToken != address(0), "Invalid to token");
        require(amount > 0, "Invalid amount");
        require(swapData.length > 0, "Invalid swap data");

        // Mark swap as executed
        executedSwaps[swapId] = true;

        try this._executeSwap(
            fromToken,
            toToken,
            amount,
            minReturnAmount,
            swapData
        ) {
            // Calculate actual return amount
            uint256 actualReturnAmount = IERC20(toToken).balanceOf(address(this));
            
            emit SwapExecuted(
                swapId,
                msg.sender,
                fromToken,
                toToken,
                amount,
                actualReturnAmount,
                block.timestamp
            );
        } catch Error(string memory reason) {
            // Revert the executed status
            executedSwaps[swapId] = false;
            
            emit SwapFailed(swapId, msg.sender, reason, block.timestamp);
            revert(reason);
        } catch {
            // Revert the executed status
            executedSwaps[swapId] = false;
            
            emit SwapFailed(swapId, msg.sender, "Swap execution failed", block.timestamp);
            revert("Swap execution failed");
        }
    }

    /**
     * @dev Internal function to execute the actual swap
     */
    function _executeSwap(
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 minReturnAmount,
        bytes calldata swapData
    ) external {
        require(msg.sender == address(this), "Only self call");

        // Transfer tokens from HTLC escrow if needed
        if (fromToken != address(0)) {
            IERC20(fromToken).safeTransferFrom(htlcEscrow, address(this), amount);
        }

        // Execute 1inch swap
        (bool success, ) = oneInchRouter.call(swapData);
        require(success, "1inch swap failed");

        // Verify minimum return amount
        uint256 returnAmount = IERC20(toToken).balanceOf(address(this));
        require(returnAmount >= minReturnAmount, "Insufficient return amount");

        // Transfer tokens back to HTLC escrow
        IERC20(toToken).safeTransfer(htlcEscrow, returnAmount);
    }

    /**
     * @dev Execute swap for ETH
     */
    function executeSwapETH(
        bytes32 swapId,
        address toToken,
        uint256 minReturnAmount,
        uint256 slippage,
        bytes calldata swapData
    ) external 
        payable 
        nonReentrant 
        onlyAuthorized 
        validSlippage(slippage)
        swapNotExecuted(swapId)
    {
        require(toToken != address(0), "Invalid to token");
        require(msg.value > 0, "Invalid ETH amount");
        require(swapData.length > 0, "Invalid swap data");

        // Mark swap as executed
        executedSwaps[swapId] = true;

        try this._executeSwapETH(toToken, minReturnAmount, swapData) {
            // Calculate actual return amount
            uint256 actualReturnAmount = IERC20(toToken).balanceOf(address(this));
            
            emit SwapExecuted(
                swapId,
                msg.sender,
                address(0), // ETH
                toToken,
                msg.value,
                actualReturnAmount,
                block.timestamp
            );
        } catch Error(string memory reason) {
            // Revert the executed status
            executedSwaps[swapId] = false;
            
            emit SwapFailed(swapId, msg.sender, reason, block.timestamp);
            revert(reason);
        } catch {
            // Revert the executed status
            executedSwaps[swapId] = false;
            
            emit SwapFailed(swapId, msg.sender, "ETH swap execution failed", block.timestamp);
            revert("ETH swap execution failed");
        }
    }

    /**
     * @dev Internal function to execute ETH swap
     */
    function _executeSwapETH(
        address toToken,
        uint256 minReturnAmount,
        bytes calldata swapData
    ) external {
        require(msg.sender == address(this), "Only self call");

        // Execute 1inch swap with ETH
        (bool success, ) = oneInchRouter.call{value: msg.value}(swapData);
        require(success, "1inch ETH swap failed");

        // Verify minimum return amount
        uint256 returnAmount = IERC20(toToken).balanceOf(address(this));
        require(returnAmount >= minReturnAmount, "Insufficient return amount");

        // Transfer tokens to HTLC escrow
        IERC20(toToken).safeTransfer(htlcEscrow, returnAmount);
    }

    /**
     * @dev Get quote for a token swap
     * @param fromToken Address of the token to swap from
     * @param toToken Address of the token to swap to
     * @param amount Amount of fromToken to swap
     * @return returnAmount Expected amount of toToken
     * @return priceImpact Price impact of the swap
     */
    function getSwapQuote(
        address fromToken,
        address toToken,
        uint256 amount
    ) external view returns (uint256 returnAmount, uint256 priceImpact) {
        require(fromToken != address(0), "Invalid from token");
        require(toToken != address(0), "Invalid to token");
        require(amount > 0, "Invalid amount");

        // This would typically call 1inch's quote API
        // For now, return a simple calculation
        // In production, this should call the actual 1inch quote function
        
        // Placeholder implementation
        returnAmount = amount; // 1:1 for now
        priceImpact = 0; // No price impact for now
    }

    /**
     * @dev Check if a swap has been executed
     * @param swapId Unique identifier for the swap
     * @return True if the swap has been executed
     */
    function isSwapExecuted(bytes32 swapId) external view returns (bool) {
        return executedSwaps[swapId];
    }

    /**
     * @dev Update the 1inch router address
     * @param newRouter Address of the new 1inch router
     */
    function updateRouter(address newRouter) external onlyOwner {
        require(newRouter != address(0), "Invalid router address");
        
        address oldRouter = oneInchRouter;
        oneInchRouter = newRouter;
        
        emit RouterUpdated(oldRouter, newRouter, block.timestamp);
    }

    /**
     * @dev Add or remove authorized caller
     * @param caller Address of the caller
     * @param authorized Whether the caller is authorized
     */
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        require(caller != address(0), "Invalid caller address");
        authorizedCallers[caller] = authorized;
    }

    /**
     * @dev Emergency function to recover tokens
     * @param token Address of the token to recover
     * @param amount Amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    /**
     * @dev Get contract balance for a token
     * @param token Address of the token
     * @return Balance of the token
     */
    function getBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(token).balanceOf(address(this));
        }
    }

    /**
     * @dev Get contract information
     * @return router Address of the 1inch router
     * @return escrow Address of the HTLC escrow
     * @return executedCount Number of executed swaps
     */
    function getContractInfo() external view returns (
        address router,
        address escrow,
        uint256 executedCount
    ) {
        router = oneInchRouter;
        escrow = htlcEscrow;
        // Note: In a real implementation, you'd track the executed count
        executedCount = 0;
    }

    // Receive ETH
    receive() external payable {}
}
