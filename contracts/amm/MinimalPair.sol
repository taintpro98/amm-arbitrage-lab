// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "../libraries/Math.sol";

/// @title MinimalPair
/// @notice Educational constant-product AMM (x*y=k) with internal LP shares (not an ERC-20 LP token).
/// @dev Fee: 0.30% (997/1000) on swaps, Uniswap V2–style. Not production-audited.
///
/// Future extensions (see PHASE.md): factory, router, ERC-20 LP, dynamic fees, TWAP, arbitrage scripts.
contract MinimalPair is ReentrancyGuard {
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    /// @notice Swap fee in basis points over 1000 (997/1000 ≈ 0.30%).
    uint256 public constant FEE_NUMERATOR = 997;
    uint256 public constant FEE_DENOMINATOR = 1000;

    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint256 public reserve0;
    uint256 public reserve1;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    event Mint(address indexed sender, uint256 amount0, uint256 amount1, uint256 liquidity);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, uint256 liquidity, address indexed to);
    event Swap(
        address indexed sender,
        address indexed tokenIn,
        uint256 amountIn,
        uint256 amountOut,
        address indexed to
    );
    event Sync(uint256 reserve0, uint256 reserve1);

    error InvalidTokens();
    error InsufficientLiquidityMinted();
    error InsufficientLiquidityBurned();
    error InsufficientOutput();
    error InsufficientInput();
    error InvalidTo();

    constructor(address tokenA, address tokenB) {
        if (tokenA == address(0) || tokenB == address(0)) revert InvalidTokens();
        if (tokenA == tokenB) revert InvalidTokens();
        (address t0, address t1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        token0 = IERC20(t0);
        token1 = IERC20(t1);
    }

    function getReserves() external view returns (uint256, uint256) {
        return (reserve0, reserve1);
    }

    /// @notice Add liquidity; pulls `amount0Desired` / `amount1Desired` from msg.sender.
    function mint(uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min)
        external
        nonReentrant
        returns (uint256 liquidity)
    {
        token0.transferFrom(msg.sender, address(this), amount0Desired);
        token1.transferFrom(msg.sender, address(this), amount1Desired);

        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));
        uint256 amount0 = balance0 - reserve0;
        uint256 amount1 = balance1 - reserve1;

        if (totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            if (liquidity == 0) revert InsufficientLiquidityMinted();
            _mint(address(0x000000000000000000000000000000000000dEaD), MINIMUM_LIQUIDITY);
            _mint(msg.sender, liquidity);
        } else {
            liquidity = _min(amount0 * totalSupply / reserve0, amount1 * totalSupply / reserve1);
            if (liquidity == 0) revert InsufficientLiquidityMinted();
            _mint(msg.sender, liquidity);
        }

        if (amount0 < amount0Min || amount1 < amount1Min) revert InsufficientLiquidityMinted();

        _update(balance0, balance1);
        emit Mint(msg.sender, amount0, amount1, liquidity);
    }

    /// @notice Burn LP shares and receive underlying tokens.
    function burn(uint256 liquidity, uint256 amount0Min, uint256 amount1Min, address to)
        external
        nonReentrant
        returns (uint256 amount0, uint256 amount1)
    {
        if (to == address(0)) revert InvalidTo();
        uint256 _reserve0 = reserve0;
        uint256 _reserve1 = reserve1;

        uint256 _totalSupply = totalSupply;
        amount0 = liquidity * _reserve0 / _totalSupply;
        amount1 = liquidity * _reserve1 / _totalSupply;
        if (amount0 == 0 || amount1 == 0) revert InsufficientLiquidityBurned();
        if (amount0 < amount0Min || amount1 < amount1Min) revert InsufficientLiquidityBurned();

        _burn(msg.sender, liquidity);

        token0.transfer(to, amount0);
        token1.transfer(to, amount1);

        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));
        _update(balance0, balance1);

        emit Burn(msg.sender, amount0, amount1, liquidity, to);
    }

    /// @notice Swap `tokenIn` for the other asset. Pulls `amountIn` from msg.sender.
    function swap(address tokenIn, uint256 amountIn, uint256 amountOutMin, address to)
        external
        nonReentrant
        returns (uint256 amountOut)
    {
        if (to == address(0)) revert InvalidTo();
        if (amountIn == 0) revert InsufficientInput();

        bool zeroForOne = address(tokenIn) == address(token0);
        if (!zeroForOne && address(tokenIn) != address(token1)) revert InvalidTokens();

        uint256 _reserve0 = reserve0;
        uint256 _reserve1 = reserve1;

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        if (zeroForOne) {
            amountOut = _getAmountOut(amountIn, _reserve0, _reserve1);
            if (amountOut < amountOutMin) revert InsufficientOutput();
            token1.transfer(to, amountOut);
        } else {
            amountOut = _getAmountOut(amountIn, _reserve1, _reserve0);
            if (amountOut < amountOutMin) revert InsufficientOutput();
            token0.transfer(to, amountOut);
        }

        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));
        _update(balance0, balance1);

        emit Swap(msg.sender, tokenIn, amountIn, amountOut, to);
    }

    /// @notice Constant-product output with fee, given exact input (Uniswap V2 style).
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut) {
        if (amountIn == 0) return 0;
        bool zeroForOne = address(tokenIn) == address(token0);
        if (!zeroForOne && address(tokenIn) != address(token1)) revert InvalidTokens();
        (uint256 r0, uint256 r1) = (reserve0, reserve1);
        if (zeroForOne) {
            return _getAmountOut(amountIn, r0, r1);
        }
        return _getAmountOut(amountIn, r1, r0);
    }

    function _getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        internal
        pure
        returns (uint256)
    {
        if (reserveIn == 0 || reserveOut == 0) return 0;
        uint256 amountInWithFee = amountIn * FEE_NUMERATOR;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * FEE_DENOMINATOR + amountInWithFee;
        return numerator / denominator;
    }

    function _update(uint256 balance0, uint256 balance1) private {
        reserve0 = balance0;
        reserve1 = balance1;
        emit Sync(reserve0, reserve1);
    }

    function _mint(address to, uint256 value) private {
        totalSupply += value;
        balanceOf[to] += value;
    }

    function _burn(address from, uint256 value) private {
        uint256 bal = balanceOf[from];
        if (bal < value) revert InsufficientLiquidityBurned();
        unchecked {
            balanceOf[from] = bal - value;
            totalSupply -= value;
        }
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
}
