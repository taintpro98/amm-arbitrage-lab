// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Integer square root (Babylonian method). Used for initial liquidity in constant-product pools.
library Math {
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y == 0) {
            return 0;
        }
        if (y <= 3) {
            return 1;
        }
        z = y;
        uint256 x = y / 2 + 1;
        while (x < z) {
            z = x;
            x = (y / x + x) / 2;
        }
    }
}
