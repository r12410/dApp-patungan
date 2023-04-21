// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

interface IBergerakWhitelist {
    function factory() external view returns(address);
    function initialize(string memory _name) external;
    function merkleRoot() external view returns(bytes32);
    function name() external view returns(string memory);
    function setMerkleRoot(bytes32 _merkleRoot) external;
    function setNewName(string memory newName) external;
    function verifyMember(
        address user,
        bytes32[] memory merkleProof
    ) external view returns(bool isMember);
}