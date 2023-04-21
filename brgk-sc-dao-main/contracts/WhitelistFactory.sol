import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interface/IWhitelist.sol";

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

contract BergerakWhitelistFactory is Ownable {
    using Counters for Counters.Counter;

    address public implementations;
    Counters.Counter private _totalWhitelist;

    mapping (uint256 => address) public whitelist;

    constructor(address _implements) {
        implementations = _implements;
    }

    function totalWhitelist() public view virtual returns(uint256) {
        return _totalWhitelist.current();
    }

    function createWhitelist(string memory name) external onlyOwner {
        uint256 index = totalWhitelist();
        bytes32 salt = keccak256(abi.encodePacked(index, _msgSender()));

        _totalWhitelist.increment();
        address wl = Clones.cloneDeterministic(implementations, salt);
        IBergerakWhitelist(wl).initialize(name);

        whitelist[index] = wl;
    }
}