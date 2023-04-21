// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

interface IBergerakEmblem {
    function balanceAllOf(address owner) external view returns(uint256);
    function balanceOf(
        address account,
        uint256 id
    ) external view returns(uint256);
    function balanceOfBatch(
        address[] memory accounts,
        uint256[] memory ids
    ) external view returns(uint256[] memory);
    function burnBatchFrom(
        uint256 id,
        uint256 amount,
        address[] memory from
    ) external;
    function burnFrom(
        uint256 id,
        uint256 amount,
        address from
    ) external;
    function isApprovedForAll(
        address account,
        address operator
    ) external view returns(bool);
    function mintBatchTo(
        uint256 id,
        uint256 amount,
        address[] memory to
    ) external;
    function mintTo(
        uint256 id,
        uint256 amount,
        address to
    ) external;
    function name() external view returns(string memory);
    function owner() external view returns(address);
    function renounceOwnership() external;
    function safeBatchTransferFrom(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) external;
    function safeTransferFrom(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) external;
    function setApprovalForAll(
        address,
        bool
    ) external;
    function setHash(
        uint256 id,
        string memory hash
    ) external;
    function supportsInterface(bytes4 interfaceId) external view returns(bool);
    function symbol() external view returns(string memory);
    function transferOwnership(address newOwner) external;
    function uri(uint256 id) external view returns(string memory);
}