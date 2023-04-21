import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interface/IWhitelist.sol";
import "./interface/IMassWalletFactory.sol";

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

contract BergerakMassWallet is Context, Initializable, ReentrancyGuard {
    using Address for address;
    using Address for address payable;
    using Counters for Counters.Counter;

    uint256 public voteLimit;
    address public whitelist;
    address public factory;
    string public name;

    Counters.Counter private _totalTx;

    mapping (uint256 => PrepTx) public txStats;
    mapping (uint256 => Txs[]) public txData;
    mapping (address => mapping (uint256 => bool)) public txVote;

    struct PrepTx {
        bool executed;
        uint256 signed;
    }
    struct Txs {
        TxType typeTx;
        address to;
        uint256 value;
        bytes data;
    }

    enum TxType {
        sendValue,
        call,
        callWithvalue
    }

    event SignTx(
        uint256 indexed txId,
        address signer
    );
    event CreateTx(
        uint256 indexed txId,
        Txs[] data
    );
    event ExecuteTx(
        uint256 indexed txId,
        Txs[] data
    );

    constructor() {
        _disableInitializers();
    }

    receive() external payable {}

    modifier onlyMultisignMember(bytes32[] memory merkleproof) {
        require(
            IBergerakWhitelist(whitelist).verifyMember(
                _msgSender(), merkleproof
            ) == true,
            "BergerakMassWallet : You're not whitelisted signer"
        );
        _;
    }

    modifier onlyFactoryOwner() {
        require(
            _msgSender() == IBergerakMassWalletFactory(factory).owner(),
            "BergerakMassWallet : Only factory owner allowed"
        );
        _;
    }

    function initialize (
        uint256 _voteLimit,
        address _whitelist,
        string memory _name
    ) initializer external {
        name = _name;
        voteLimit = _voteLimit;
        whitelist = _whitelist;
        factory = _msgSender();
    }

    function createTx(
        Txs[] memory transaction,
        bytes32[] memory merkleproof
    ) external onlyMultisignMember(merkleproof) nonReentrant {
        uint256 index = totalTx();

        for(uint i = 0; i < transaction.length; i++) {
           txData[index].push(transaction[i]); 
        }

        txStats[index].signed += 1;
        txVote[_msgSender()][index] = true;

        emit CreateTx(
            index,
            transaction
        );
        emit SignTx(
            index,
            _msgSender()
        );
    }

    function signTx(
        uint256 transactionId,
        bytes32[] memory merkleproof
    ) external onlyMultisignMember(merkleproof) nonReentrant {
        require(
            transactionId < totalTx(),
            "BergerakMultisign : Invalid tx"
        );
        require(
            txVote[_msgSender()][transactionId] == false,
            "BergerakMultisign : You already sign"
        );
        require(
            txStats[transactionId].executed == false,
            "BergerakMultisign : Already executed"
        );

        txStats[transactionId].signed += 1;
        txVote[_msgSender()][transactionId] = true;

        emit SignTx(
            transactionId,
            _msgSender()
        );
    }

    function executeTx(uint256 transactionId) external nonReentrant {
        require(
            transactionId < totalTx(),
            "BergerakMultisign : Invalid tx"
        );
        require(
            txStats[transactionId].signed >= voteLimit,
            "BergerakMultisign : Insufficient signer"
        );
        require(
            txStats[transactionId].executed == false,
            "BergerakMultisign : Already executed"
        );

        txStats[transactionId].executed = true;

        for(uint256 a; a < txData[transactionId].length; a++){
            if (txData[transactionId][a].typeTx == TxType.callWithvalue) {
                _callContractWithValue(
                    txData[transactionId][a].to,
                    txData[transactionId][a].value,
                    txData[transactionId][a].data
                );
            } else if (txData[transactionId][a].typeTx == TxType.call) {
                _callContract(txData[transactionId][a].to, txData[transactionId][a].data);
            } else {
                _sendValue(txData[transactionId][a].to, txData[transactionId][a].value);
            }
        }

        emit ExecuteTx(
            transactionId,
            txData[transactionId]
        );
    }

    function totalTx() public view returns(uint256) {
        return _totalTx.current();
    }

    function setNewVoteLimit(uint256 newVoteLimit) external onlyFactoryOwner {
        voteLimit = newVoteLimit;
    }

    function setNewName(string memory newName) external onlyFactoryOwner {
        name = newName;
    }

    /**
     * @dev this is private function for transaction purpose
     */

    function _sendValue(
        address to,
        uint256 amount
    ) private {
        require(
            msg.value >= amount,
            "multicall : insufficient value"
        );

        payable(to).sendValue(amount);
    }

    function _callContract(
        address to,
        bytes memory data
    ) private {
        require(
            to.isContract() == true,
            "multicall : to address is not contract"
        );

        to.functionCall(data);
    }

    function _callContractWithValue(
        address to,
        uint256 value,
        bytes memory data
    ) private {
        require(
            to.isContract() == true,
            "multicall : to address is not contract"
        );
        require(
            msg.value >= value,
            "multicall : insufficient value"
        );

        to.functionCallWithValue(data, value);
    }
}