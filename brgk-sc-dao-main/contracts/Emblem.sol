import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

contract BergerakEmblem is ERC1155, Ownable {
    string public name;
    string public symbol;

    mapping (uint256 => string) private _hash;
    mapping (address => uint256) private _balances;

    constructor(
        string memory tokenName,
        string memory tokenSymbol
    ) ERC1155('ipfs://') {
        name = tokenName;
        symbol = tokenSymbol;
    }

    function setHash(uint256 id, string memory hash) external onlyOwner {
        _hash[id] = hash;
    }

    function mintTo(uint256 id, uint256 amount, address to) external onlyOwner {
        _mint(to, id, amount, '');
        _balances[to] += amount;
    }

    function mintBatchTo(uint256 id, uint256 amount, address[] memory to) external onlyOwner {
        for(uint256 a; a < to.length; a++){
            _mint(to[a], id, amount, '');
            _balances[to[a]] += amount;
        }
    }

    function burnFrom(uint256 id, uint256 amount, address from) external onlyOwner {
        _burn(from, id, amount);
        _balances[from] -= amount;
    }

    function burnBatchFrom(uint256 id, uint256 amount, address[] memory from) external onlyOwner {
        for(uint256 a; a < from.length; a++){
            _burn(from[a], id, amount);
            _balances[from[a]] -= amount;
        }
    }

    function balanceAllOf(address owner) public view virtual returns (uint256) {
        require(owner != address(0), "BergerakEmblem: address zero is not a valid owner");
        return _balances[owner];
    }

    /**
     * @dev The function below is the overriding function of the library used
     * so that it can be adjusted to your needs
     */

    function uri(uint256 id) public view virtual override returns (string memory) {
        string memory baseUri = super.uri(id);
        return string(abi.encodePacked(baseUri, _hash[id]));
    }

    function setApprovalForAll(address, bool) public virtual override {
        revert("BergerakEmblem : This emblem is untransferable");
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override {
        revert("BergerakEmblem : This emblem is untransferable");
    }

    function safeBatchTransferFrom(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override {
        revert("BergerakEmblem : This emblem is untransferable");
    }
}