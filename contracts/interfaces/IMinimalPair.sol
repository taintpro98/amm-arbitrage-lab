// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal read surface for scripts/tests and future routers.
interface IMinimalPair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint256 reserve0, uint256 reserve1);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}
