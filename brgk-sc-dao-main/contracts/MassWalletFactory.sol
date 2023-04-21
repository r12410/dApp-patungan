import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interface/IMassWallet.sol";

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

contract BergerakMassWalletFactory is Ownable {
    using Counters for Counters.Counter;

    address public implementations;
    Counters.Counter private _totalMassWallet;

    mapping (uint256 => address) public MassWallet;

    constructor(address _implements) {
        implementations = _implements;
    }

    function totalMassWallet() public view virtual returns(uint256) {
        return _totalMassWallet.current();
    }

    function createMassWallet(
        uint256 voteLimit,
        address whitelist,
        string memory name
    ) external onlyOwner {
        uint256 index = totalMassWallet();
        bytes32 salt = keccak256(abi.encodePacked(index, _msgSender()));

        _totalMassWallet.increment();
        address mw = Clones.cloneDeterministic(implementations, salt);
        IBergerakMassWallet(mw).initialize(
            voteLimit,
            whitelist,
            name
        );

        MassWallet[index] = mw;
    }
}