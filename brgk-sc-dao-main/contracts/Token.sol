import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

contract BergerakToken is ERC20 {
    constructor(
        uint256 supply,
        string memory tokenName,
        string memory tokenSymbol
    ) ERC20(tokenName, tokenSymbol) {
        _mint(_msgSender(), supply);
    }
}