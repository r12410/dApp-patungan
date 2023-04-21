import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./interface/IWhitelistFactory.sol";

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

contract BergerakWhitelist is Context, Initializable {
    address public factory;
    string public name;
    bytes32 public merkleRoot;

    constructor(){
        _disableInitializers();
    }

    modifier onlyFactoryOwner() {
        require(
            _msgSender() == IBergerakWhitelistFactory(factory).owner(),
            "BergerakWhitelist : Only factory owner allowed"
        );
        _;
    }

    function initialize (string memory _name) initializer external {
        name = _name;
        factory = _msgSender();
    }

    function setNewName(string memory newName) external onlyFactoryOwner {
        name = newName;
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyFactoryOwner {
        merkleRoot = _merkleRoot;
    }

    function verifyMember(
        address user,
        bytes32[] memory merkleProof
    ) public view returns(bool isMember){
        bytes32 leaf = _getLeaf(user);
        return MerkleProof.verify(merkleProof, merkleRoot, leaf);
    }

    function _getLeaf(address user) private pure returns(bytes32 leaf) {
        return keccak256(abi.encodePacked(user));
    }
}