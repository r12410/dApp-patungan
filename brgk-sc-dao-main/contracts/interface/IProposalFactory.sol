import "./IProposal.sol";

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

interface IBergerakProposalFactory {
    function acceptProposal(uint256 pendingId) external;
    function configClaim(uint256) external view returns(
        uint8 arg1,
        uint8 arg2
    );
    function createProposal(
        uint256 requireSigner,
        uint256 requireFunded,
        uint256 deadline,
        bytes32 whitelist,
        string memory proposalName,
        string memory proposalIpfsData
    ) external;
    function editProposal(
        uint256 pendingId,
        uint256 requireSigner,
        uint256 requireFunded,
        uint256 deadline,
        bytes32 whitelist,
        string memory proposalName,
        string memory proposalIpfsData
    ) external;
    function emblem() external view returns(address);
    function implementations() external view returns(address);
    function owner() external view returns(address);
    function pendingProposal(uint256) external view returns(
        uint8 proposalStatus,
        address deployedAt,
        bytes32 whitelist,
        IBergerakProposal.Proposal memory proposal
    );
    function proposal(uint256) external view returns(address);
    function rejectProposal(uint256 pendingId) external;
    function renounceOwnership() external;
    function setConfigClaim(IBergerakProposal.ClaimPercentage[] memory data) external;
    function token() external view returns(address);
    function totalAcceptedProposal() external view returns(uint256);
    function totalPendingProposal() external view returns(uint256);
    function totalRejectedProposal() external view returns(uint256);
    function totalProposal() external view returns(uint256);
    function transferOwnership(address newOwner) external;
}