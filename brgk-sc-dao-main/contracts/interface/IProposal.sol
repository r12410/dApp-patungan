// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

interface IBergerakProposal {
    struct Proposal {
        uint256 requireSigner;
        uint256 requireFunded;
        uint256 deadline;
        address proposer;
        string proposalName;
        string proposalIpfsData;
    }
    struct ClaimPercentage {
        uint8 arg1;
        uint8 arg2;
    }

    function claiming() external;
    function contribute(address) external view returns(uint256);
    function contributing(uint256 amount) external;
    function factory() external view returns(address);
    function getStatus() external view returns(uint8);
    function initialize(
        address _token,
        bytes32 _whitelist,
        ClaimPercentage[] memory _claimProgress,
        Proposal memory _proposalData
    ) external;
    function percentageClaim(uint8) external view returns(
        uint8 arg1,
        uint8 arg2
    );
    function progress() external view returns(
        uint8 claimProgress,
        uint256 totalSigner,
        uint256 totalFunded
    );
    function proposal() external view returns(
        uint256 requireSigner,
        uint256 requireFunded,
        uint256 deadline,
        address proposer, 
        string memory proposalName, 
        string memory proposalIpfsData
    );
    function refunding() external;
    function signed(address) external view returns(bool);
    function signing(bytes32[] memory merkleproof) external;
    function token() external view returns(address);
    function totalProgressClaim() external view returns(uint8);
    function unlockClaim(uint8 unlockId) external;
    function unlockedClaim(uint8) external view returns(bool);
    function merkleRoot() external view returns(bytes32);
}