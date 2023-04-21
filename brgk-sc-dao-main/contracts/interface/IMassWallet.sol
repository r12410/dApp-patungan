// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

interface IBergerakMassWallet {
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

    function createTx(
        Txs[] memory transaction,
        bytes32[] memory merkleproo
    ) external;
    function executeTx(uint256 transactionId) external;
    function factory() external view returns(address);
    function initialize(
        uint256 _voteLimit,
        address _whitelist,
        string memory _name
    ) external;
    function name() external view returns(string memory);
    function setNewName(string memory newName) external;
    function setNewVoteLimit(uint256 newVoteLimit) external;
    function signTx(
        uint256 transactionId,
        bytes32[] memory merkleproof
    ) external;
    function totalTx() external view returns(uint256);
    function txData(
        uint256,
        uint256
    ) external view returns(
        uint8 typeTx,
        address to,
        uint256 value, 
        bytes memory data
    );
    function txStats(uint256) external view returns(
        bool executed,
        uint256 signed
    );
    function txVote(address, uint256) external view returns(bool);
    function voteLimit() external view returns(uint256);
    function whitelist() external view returns(address);
    }