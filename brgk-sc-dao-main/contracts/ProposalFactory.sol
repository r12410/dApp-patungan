import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interface/IProposal.sol";
import "./interface/IEmblem.sol";

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

contract BergerakProposalFactory is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    address public emblem;
    address public token;
    address public implementations;
    IBergerakProposal.ClaimPercentage[] public configClaim;

    Counters.Counter private _totalProposal;
    Counters.Counter private _totalPendingProposal;
    Counters.Counter private _totalAcceptedProposal;
    Counters.Counter private _totalRejectedProposal;

    mapping (uint256 => address) public proposal;
    mapping (uint256 => ProposalData) public pendingProposal;

    struct ProposalData {
        Status proposalStatus;
        address deployedAt;
        bytes32 whitelist;
        IBergerakProposal.Proposal proposal;
    }

    enum Status {
        pending,
        approved,
        rejected
    }

    event CreatedProposal(
        uint256 indexed pendingId,
        IBergerakProposal.Proposal proposal
    );
    event EditedProposal(
        uint256 indexed pendingId,
        IBergerakProposal.Proposal proposal
    );
    event AcceptedProposal(
        uint256 indexed pendingId,
        address proposalAddress
    );
    event RejectedProposal(
        uint256 indexed pendingId
    );

    constructor(
        address _token,
        address _emblem,
        address _implements
    ) {
        token = _token;
        emblem = _emblem;
        implementations = _implements;

        configClaim.push(IBergerakProposal.ClaimPercentage(80, 1));
        configClaim.push(IBergerakProposal.ClaimPercentage(20, 1));
    }

    function totalProposal() public view virtual returns(uint256) {
        return _totalProposal.current();
    }

    function totalPendingProposal() public view virtual returns(uint256) {
        return _totalPendingProposal.current();
    }

    function totalAcceptedProposal() public view virtual returns(uint256) {
        return _totalAcceptedProposal.current();
    }

    function totalRejectedProposal() public view virtual returns(uint256) {
        return _totalRejectedProposal.current();
    }

    function setConfigClaim(
        IBergerakProposal.ClaimPercentage[] memory data
    ) external onlyOwner {
        unchecked{
            uint256 value = uint256(1 ether);
            uint256 valueCounted;

            for(uint256 x; x < data.length; x++){
                valueCounted += ((value * uint256(
                    data[x].arg1
                )) / uint256(
                    data[x].arg2
                )) / 100;
            }

            require(
                value >= valueCounted &&
                (value - valueCounted) < 1000,
                "BergerakProposalFactory : Intolerant precentation"
            );
        }

        for(uint256 a; a <= configClaim.length; a++){
            configClaim.pop();
        }

        for(uint256 b; b < data.length; b++){
            configClaim.push(data[b]);
        }
    }

    function rejectProposal(uint256 pendingId) external onlyOwner {
        require(
            pendingProposal[pendingId].proposalStatus == Status.pending,
            "BergerakProposalFactory : Pending proposal already reviewed"
        );
        require(
            pendingId < totalProposal(),
            "BergerakProposalFactory : Proposal is unavailable"
        );

        _totalRejectedProposal.increment();
        _totalPendingProposal.decrement();
        pendingProposal[pendingId].proposalStatus = Status.rejected;

        emit RejectedProposal(pendingId);
    }

    function acceptProposal(uint256 pendingId) external onlyOwner {
        require(
            pendingProposal[pendingId].proposalStatus == Status.pending,
            "BergerakProposalFactory : Pending proposal already reviewed"
        );
        require(
            pendingId < totalProposal(),
            "BergerakProposalFactory : Proposal is unavailable"
        );

        uint256 index = totalAcceptedProposal();
        _totalAcceptedProposal.increment();
        _totalPendingProposal.decrement();

        bytes32 salt = keccak256(abi.encodePacked(pendingId, _msgSender()));
        address pr = Clones.cloneDeterministic(implementations, salt);
        IBergerakProposal(pr).initialize(
            token,
            pendingProposal[pendingId].whitelist,
            configClaim,
            pendingProposal[pendingId].proposal
        );

        proposal[index] = pr;
        pendingProposal[pendingId].proposalStatus = Status.approved;
        pendingProposal[pendingId].deployedAt = pr;

        emit AcceptedProposal(
            pendingId,
            pr
        );
    }

    function editProposal(
        uint256 pendingId,
        uint256 requireSigner,
        uint256 requireFunded,
        uint256 deadline,
        bytes32 whitelist,
        string memory proposalName,
        string memory proposalIpfsData
    ) external nonReentrant {
        require(
            pendingProposal[pendingId].proposalStatus == Status.pending,
            "BergerakProposalFactory : Pending proposal already reviewed"
        );
        require(
            pendingProposal[pendingId].proposal.proposer == _msgSender() ||
            owner() == _msgSender(),
            "BergerakProposalFactory : You're not proposer or owner"
        );
        require(
            pendingId < totalProposal(),
            "BergerakProposalFactory : Proposal is unavailable"
        );
        require(
            requireSigner >= 2,
            "BergerakProposalFactory : Minimum signer is 2"
        );

        IBergerakProposal.Proposal memory data = IBergerakProposal.Proposal(
            requireSigner,
            requireFunded,
            deadline,
            pendingProposal[pendingId].proposal.proposer,
            proposalName,
            proposalIpfsData
        );
        pendingProposal[pendingId] = ProposalData(
            Status.pending,
            address(0),
            whitelist,
            data
        );

        emit EditedProposal(
            pendingId,
            data
        );
    }

    function createProposal(
        uint256 requireSigner,
        uint256 requireFunded,
        uint256 deadline,
        bytes32 whitelist,
        string memory proposalName,
        string memory proposalIpfsData
    ) external nonReentrant {
        require(
            requireSigner >= 2,
            "BergerakProposalFactory : Minimum signer is 2"
        );
        require(
            IBergerakEmblem(emblem).balanceAllOf(_msgSender()) > 0,
            "BergerakProposalFactory : You dont have emblem nft, not allowed create proposal"
        );

        uint256 index = totalProposal();
        _totalProposal.increment();
        _totalPendingProposal.increment();

        IBergerakProposal.Proposal memory data = IBergerakProposal.Proposal(
            requireSigner,
            requireFunded,
            deadline,
            _msgSender(),
            proposalName,
            proposalIpfsData
        );
        pendingProposal[index] = ProposalData(
            Status.pending,
            address(0),
            whitelist,
            data
        );

        emit CreatedProposal(
            index,
            data
        );
    }
}