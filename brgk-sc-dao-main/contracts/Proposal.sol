import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./interface/IProposalFactory.sol";

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

contract BergerakProposal is Context, Initializable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bool public disputed;
    uint8 public totalProgressClaim;
    address public factory;
    address public token;
    bytes32 public merkleRoot;
    Proposal public proposal;
    Progress public progress;

    mapping (address => bool) public signed;
    mapping (address => bool) public voted;
    mapping (address => uint256) public contribute;
    mapping (uint8 => ClaimPercentage) public percentageClaim;
    mapping (uint8 => bool) public unlockedClaim;

    struct Proposal {
        uint256 requireSigner;
        uint256 requireFunded;
        uint256 deadline;
        address proposer;
        string proposalName;
        string proposalIpfsData;
    }
    struct Progress {
        uint8 claimProgress;
        uint256 totalSigner;
        uint256 totalVoter;
        uint256 totalFunded;
    }
    struct ClaimPercentage {
        uint8 arg1;
        uint8 arg2;
    }

    enum Status {
        ongoing,
        success,
        failed
    }

    event Signed(
        address indexed signer
    );
    event Voted(
        address indexed voter
    );
    event Contributed(
        address indexed contributor,
        uint256 amount
    );
    event Claimed(
        address indexed proposer,
        uint256 amount
    );
    event Refunded(
        address indexed contributor,
        uint256 amount
    );

    constructor() {
        _disableInitializers();
    }

    modifier onlyFactoryOwner() {
        require(
            _msgSender() == IBergerakProposalFactory(factory).owner(),
            "BergerakProposal : Only factory owner allowed"
        );
        _;
    }

    function initialize (
        address _token,
        bytes32 _whitelist,
        ClaimPercentage[] memory _claimProgress,
        Proposal memory _proposalData
    ) initializer external {
        unlockedClaim[0] = true;

        for(uint8 a; a < _claimProgress.length; a++){
            percentageClaim[a] = _claimProgress[a];
            totalProgressClaim += 1;
        }

        proposal = _proposalData;
        token = _token;
        merkleRoot = _whitelist;
        factory = _msgSender();
    }

    function getStatus() public view returns (Status) {
        if(disputed == true){
            return Status.failed;
        }

        if(block.timestamp > proposal.deadline){
            return (
                    progress.totalSigner >= proposal.requireSigner &&
                    progress.totalFunded >= proposal.requireFunded
                ) 
                ? Status.success : Status.failed;
        }

        return Status.ongoing;
    }

    function signing(bytes32[] memory merkleproof) external nonReentrant {
        require(
            _verifyMember(
                _msgSender(), merkleproof
            ) == true,
            "BergerakProposal : You're not whitelisted signer"
        );
        require(
            signed[_msgSender()] == false,
            "BergerakProposal : You already sign this proposal"
        );
        require(
            getStatus() == Status.ongoing,
            "BergerakProposal : Proposal already reach deadline"
        );

        signed[_msgSender()] = true;
        progress.totalSigner += 1;

        emit Signed(_msgSender());
    }

    function voting() external nonReentrant {
        require(
            voted[_msgSender()] == false,
            "BergerakProposal : You already vote this proposal"
        );
        require(
            getStatus() == Status.ongoing,
            "BergerakProposal : Proposal already reach deadline"
        );

        voted[_msgSender()] = true;
        progress.totalVoter += 1;

        emit Voted(_msgSender());
    }

    function contributing(uint256 amount) external nonReentrant {
        require(
            getStatus() == Status.ongoing,
            "BergerakProposal : Proposal already reach deadline"
        );

        IERC20(token).safeTransferFrom(_msgSender(), address(this), amount);

        contribute[_msgSender()] += amount;
        progress.totalFunded += amount;
        emit Contributed(
            _msgSender(),
            amount
        );
    }

    function claiming() external nonReentrant {
        uint8 progressIndex = progress.claimProgress;

        require(
            _msgSender() == proposal.proposer,
            "BergerakProposal : Claimer must proposer"
        );
        require(
            progress.totalFunded > 0,
            "BergerakProposal : No balance for claim"
        );
        require(
            getStatus() == Status.success,
            "BergerakProposal : Proposal not reach deadline or failed"
        );
        require(
            unlockedClaim[progressIndex] == true,
            "BergerakProposal : Please report to admin for unlock this claim"
        );

        uint256 amount = _calculate(
            percentageClaim[progressIndex].arg1,
            percentageClaim[progressIndex].arg2,
            progress.totalFunded
        );
        progress.claimProgress += 1;
        
        IERC20(token).safeTransfer(_msgSender(), amount);

        emit Claimed(
            _msgSender(),
            amount
        );
    }

    function refunding() external nonReentrant {
        uint256 totalContribute = contribute[_msgSender()];

        require(
            getStatus() == Status.failed,
            "BergerakProposal : Proposal not reach deadline or success"
        );
        require(
            totalContribute > 0,
            "BergerakProposal : You're not contribute at this proposal"
        );

        contribute[_msgSender()] = 0;

        if(progress.claimProgress > 0){
            uint256 finalRemainContribute = totalContribute;

            for(uint256 a; a < progress.claimProgress; a++){
                uint8 index = uint8(a);
                finalRemainContribute -= _calculate(
                    percentageClaim[index].arg1,
                    percentageClaim[index].arg2,
                    totalContribute
                );
            }

            IERC20(token).safeTransfer(_msgSender(), finalRemainContribute);

            emit Refunded(
                _msgSender(),
                finalRemainContribute
            );
        }else{
            IERC20(token).safeTransfer(_msgSender(), totalContribute);

            emit Refunded(
                _msgSender(),
                totalContribute
            );
        }
    }

    function disputeProposal() external nonReentrant onlyFactoryOwner {
        require(
            disputed == false,
            "BergerakProposal : Already dispute this proposal"
        );

        disputed = true;
    }

    function unlockClaim(uint8 unlockId) external nonReentrant onlyFactoryOwner {
        require(
            unlockedClaim[unlockId] == false,
            "BergerakProposal : Already unlock this progress"
        );

        unlockedClaim[unlockId] = true;
    }

    function _calculate(
        uint8 multipler,
        uint8 diver,
        uint256 amount
    ) private pure returns(uint256 result) {
        unchecked {
            result = ((amount * uint256(multipler)) / uint256(diver)) / 100;
        }
    }

    function _verifyMember(
        address user,
        bytes32[] memory merkleProof
    ) private view returns(bool isMember){
        bytes32 leaf = _getLeaf(user);
        return MerkleProof.verify(merkleProof, merkleRoot, leaf);
    }

    function _getLeaf(address user) private pure returns(bytes32 leaf) {
        return keccak256(abi.encodePacked(user));
    }
}