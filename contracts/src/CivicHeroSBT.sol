// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CivicHeroSBT
 * @notice Soulbound (non-transferable) ERC-721 token recognizing CleanSweep civic cleaners.
 * ponytail: upgrade to SVG onchain dynamic render when multi-tier civic levels requested.
 */
contract CivicHeroSBT is ERC721, Ownable {
    using Strings for uint256;

    uint256 public nextTokenId;
    address public bountyVault;

    mapping(address => bool) public hasHeroBadge;
    mapping(uint256 => address) public badgeRecipient;
    mapping(uint256 => uint256) public badgeClaimedAt;

    string private _baseTokenURI;

    error SoulboundTransferBlocked();
    error OnlyBountyVaultAllowed();
    error AlreadyHasHeroBadge();
    error ZeroAddress();

    event HeroBadgeMinted(address indexed recipient, uint256 indexed tokenId, uint256 timestamp);
    event BountyVaultUpdated(address indexed vault);
    event BaseURIUpdated(string newBaseURI);

    modifier onlyVault() {
        if (msg.sender != bountyVault) revert OnlyBountyVaultAllowed();
        _;
    }

    constructor(
        address initialOwner,
        string memory baseURI_
    ) ERC721("CleanSweep Civic Hero", "CIVIC-HERO") Ownable(initialOwner) {
        _baseTokenURI = baseURI_;
    }

    function setBountyVault(address vault_) external onlyOwner {
        if (vault_ == address(0)) revert ZeroAddress();
        bountyVault = vault_;
        emit BountyVaultUpdated(vault_);
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @notice Mints soulbound civic badge to cleaner on first verified bounty claim.
     * @dev Called only by authorized BountyVault contract.
     */
    function mintHeroBadge(address recipient) external onlyVault returns (uint256 tokenId) {
        if (recipient == address(0)) revert ZeroAddress();
        if (hasHeroBadge[recipient]) revert AlreadyHasHeroBadge();

        tokenId = ++nextTokenId;
        hasHeroBadge[recipient] = true;
        badgeRecipient[tokenId] = recipient;
        badgeClaimedAt[tokenId] = block.timestamp;

        _safeMint(recipient, tokenId);
        emit HeroBadgeMinted(recipient, tokenId, block.timestamp);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory base = _baseURI();
        if (bytes(base).length == 0) {
            return "";
        }
        return string.concat(base, tokenId.toString(), ".json");
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Enforces soulbound property: transfers revert, mint & burn allowed.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransferBlocked();
        }
        return super._update(to, tokenId, auth);
    }
}
