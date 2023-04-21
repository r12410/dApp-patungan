// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

interface IBergerakWhitelistFactory {
    function createWhitelist(string memory name) external;
    function implementations() external view returns(address);
    function owner() external view returns(address);
    function renounceOwnership() external;
    function totalWhitelist() external view returns(uint256);
    function transferOwnership(address newOwner) external;
    function whitelist(uint256) external view returns(address);
}