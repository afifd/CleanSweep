// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {CivicHeroSBT} from "./CivicHeroSBT.sol";

/**
 * @title BountyVault
 * @notice Micro-bounty escrow for civic cleanup (illegal banners, visual blight) on Monad.
 * Supports native MON and ERC20 tokens (e.g. USDC/AUSD), multi-donor pool boosting,
 * backend ECDSA verification signatures, safe refunds upon expiration, and Soulbound Token recognition.
 *
 * ponytail: upgrade to pull-refund or multi-verifier quorum when donor lists exceed 500 participants.
 */
contract BountyVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    enum BountyStatus {
        Active,      // Funded, awaiting cleanup
        Claimed,     // Cleaned, validated via backend signature, funds disbursed
        Refunded     // Expired, funds returned to all donors
    }

    struct Bounty {
        bytes32 reportId;       // Offchain UUID / photo hash identifier
        address creator;        // Citizen/property owner who created the bounty
        address token;          // address(0) for native MON, otherwise ERC20 address
        uint256 totalPool;      // Total escrow amount locked
        uint256 feeAmount;      // Cached protocol fee withheld on claim
        uint64 createdAt;       // Timestamp created
        uint64 deadline;        // Expiration timestamp
        BountyStatus status;    // Current status
        address cleaner;        // Address that successfully claimed the bounty
        uint256 donorCount;     // Total unique donors
    }

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MAX_FEE_BPS = 1_000; // 10% maximum platform fee cap
    uint64 public constant MIN_DURATION = 1 hours;
    uint64 public constant MAX_DURATION = 90 days;

    uint256 public bountyCount;
    uint256 public feeBps = 250; // 2.5% default platform fee
    address public treasury;     // Fee receiver (Safe multi-sig / monskills agent treasury)
    address public verifier;     // Offchain AI/CV + EXIF validation backend signer
    CivicHeroSBT public heroSBT; // Soulbound recognition token

    // bountyId => Bounty
    mapping(uint256 => Bounty) public bounties;
    // reportId => bountyId (prevents duplicate active micro-bounties for same blight)
    mapping(bytes32 => uint256) public reportToBountyId;
    // bountyId => donor => contributed amount
    mapping(uint256 => mapping(address => uint256)) public donorContributions;
    // bountyId => index => donor address
    mapping(uint256 => address[]) private _bountyDonors;
    // Track used claim hashes to prevent replay
    mapping(bytes32 => bool) public executedClaims;

    // Events
    event BountyCreated(
        uint256 indexed bountyId,
        bytes32 indexed reportId,
        address indexed creator,
        address token,
        uint256 initialAmount,
        uint64 deadline
    );

    event BountyBoosted(
        uint256 indexed bountyId,
        address indexed donor,
        address token,
        uint256 additionalAmount,
        uint256 newTotalPool
    );

    event BountyClaimed(
        uint256 indexed bountyId,
        bytes32 indexed reportId,
        address indexed cleaner,
        uint256 netPayout,
        uint256 feePaid,
        bool sbtMinted
    );

    event BountyRefunded(
        uint256 indexed bountyId,
        uint256 donorCount,
        uint256 totalRefunded
    );

    event HeroSBTClaimed(address indexed cleaner, uint256 indexed tokenId);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    event FeeBpsUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event HeroSBTUpdated(address indexed oldSBT, address indexed newSBT);

    // Errors
    error ZeroAddress();
    error ZeroAmount();
    error InvalidDuration();
    error FeeTooHigh();
    error BountyAlreadyExists();
    error BountyDoesNotExist();
    error BountyNotActive();
    error BountyExpired();
    error BountyNotExpired();
    error TokenMismatch();
    error InvalidSignature();
    error SignatureExpired();
    error ClaimAlreadyExecuted();
    error NativeTransferFailed();
    error NoContributionToRefund();

    constructor(
        address initialOwner,
        address treasury_,
        address verifier_,
        address heroSBT_
    ) Ownable(initialOwner) {
        if (treasury_ == address(0) || verifier_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        verifier = verifier_;
        if (heroSBT_ != address(0)) {
            heroSBT = CivicHeroSBT(heroSBT_);
        }
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setVerifier(address newVerifier) external onlyOwner {
        if (newVerifier == address(0)) revert ZeroAddress();
        emit VerifierUpdated(verifier, newVerifier);
        verifier = newVerifier;
    }

    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        emit FeeBpsUpdated(feeBps, newFeeBps);
        feeBps = newFeeBps;
    }

    function setHeroSBT(address newHeroSBT) external onlyOwner {
        emit HeroSBTUpdated(address(heroSBT), newHeroSBT);
        heroSBT = CivicHeroSBT(newHeroSBT);
    }

    function createBounty(
        bytes32 reportId,
        address token,
        uint256 amount,
        uint64 durationSeconds
    ) external payable nonReentrant returns (uint256 bountyId) {
        if (reportId == bytes32(0)) revert ZeroAmount();
        if (reportToBountyId[reportId] != 0) revert BountyAlreadyExists();
        if (durationSeconds < MIN_DURATION || durationSeconds > MAX_DURATION) revert InvalidDuration();

        uint256 lockedAmount;
        if (token == address(0)) {
            if (msg.value == 0) revert ZeroAmount();
            lockedAmount = msg.value;
        } else {
            if (msg.value != 0) revert NativeTransferFailed();
            if (amount == 0) revert ZeroAmount();
            lockedAmount = amount;
            IERC20(token).safeTransferFrom(msg.sender, address(this), lockedAmount);
        }

        bountyId = ++bountyCount;
        uint64 deadline = uint64(block.timestamp + durationSeconds);

        bounties[bountyId] = Bounty({
            reportId: reportId,
            creator: msg.sender,
            token: token,
            totalPool: lockedAmount,
            feeAmount: 0,
            createdAt: uint64(block.timestamp),
            deadline: deadline,
            status: BountyStatus.Active,
            cleaner: address(0),
            donorCount: 1
        });

        reportToBountyId[reportId] = bountyId;
        donorContributions[bountyId][msg.sender] = lockedAmount;
        _bountyDonors[bountyId].push(msg.sender);

        emit BountyCreated(bountyId, reportId, msg.sender, token, lockedAmount, deadline);
    }

    function boostBounty(
        uint256 bountyId,
        uint256 amount
    ) external payable nonReentrant {
        Bounty storage b = bounties[bountyId];
        if (b.status != BountyStatus.Active) revert BountyNotActive();
        if (block.timestamp >= b.deadline) revert BountyExpired();

        uint256 addedAmount;
        if (b.token == address(0)) {
            if (msg.value == 0) revert ZeroAmount();
            addedAmount = msg.value;
        } else {
            if (msg.value != 0) revert NativeTransferFailed();
            if (amount == 0) revert ZeroAmount();
            addedAmount = amount;
            IERC20(b.token).safeTransferFrom(msg.sender, address(this), addedAmount);
        }

        if (donorContributions[bountyId][msg.sender] == 0) {
            _bountyDonors[bountyId].push(msg.sender);
            b.donorCount++;
        }

        donorContributions[bountyId][msg.sender] += addedAmount;
        b.totalPool += addedAmount;

        emit BountyBoosted(bountyId, msg.sender, b.token, addedAmount, b.totalPool);
    }

    function claimBounty(
        uint256 bountyId,
        address cleaner,
        uint256 sigExpiry,
        bytes calldata signature
    ) external nonReentrant {
        if (cleaner == address(0)) revert ZeroAddress();
        if (block.timestamp > sigExpiry) revert SignatureExpired();

        Bounty storage b = bounties[bountyId];
        if (b.status != BountyStatus.Active) revert BountyNotActive();
        if (block.timestamp >= b.deadline) revert BountyExpired();

        bytes32 claimHash = keccak256(
            abi.encodePacked(
                block.chainid,
                address(this),
                bountyId,
                b.reportId,
                cleaner,
                sigExpiry
            )
        );

        if (executedClaims[claimHash]) revert ClaimAlreadyExecuted();

        bytes32 ethSignedMessageHash = claimHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        if (recoveredSigner != verifier) revert InvalidSignature();

        // CEI Pattern: update state before external transfers
        executedClaims[claimHash] = true;
        b.status = BountyStatus.Claimed;
        b.cleaner = cleaner;

        uint256 total = b.totalPool;
        uint256 fee = (total * feeBps) / BPS_DENOMINATOR;
        uint256 netPayout = total - fee;
        b.feeAmount = fee;

        bool sbtMinted = false;
        if (address(heroSBT) != address(0) && !heroSBT.hasHeroBadge(cleaner)) {
            try heroSBT.mintHeroBadge(cleaner) returns (uint256 tokenId) {
                sbtMinted = true;
                emit HeroSBTClaimed(cleaner, tokenId);
            } catch {
                sbtMinted = false;
            }
        }

        emit BountyClaimed(bountyId, b.reportId, cleaner, netPayout, fee, sbtMinted);

        // Disburse funds after internal state and SBT handling
        if (b.token == address(0)) {
            if (fee > 0) {
                (bool feeSent, ) = treasury.call{value: fee}("");
                if (!feeSent) revert NativeTransferFailed();
            }
            (bool payoutSent, ) = cleaner.call{value: netPayout}("");
            if (!payoutSent) revert NativeTransferFailed();
        } else {
            if (fee > 0) {
                IERC20(b.token).safeTransfer(treasury, fee);
            }
            IERC20(b.token).safeTransfer(cleaner, netPayout);
        }
    }

    function refundBounty(uint256 bountyId) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        if (b.status != BountyStatus.Active) revert BountyNotActive();
        if (block.timestamp < b.deadline) revert BountyNotExpired();

        b.status = BountyStatus.Refunded;

        address[] memory donors = _bountyDonors[bountyId];
        uint256 len = donors.length;
        uint256 totalRefunded = 0;

        uint256[] memory refundAmounts = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            address donor = donors[i];
            uint256 contrib = donorContributions[bountyId][donor];
            if (contrib > 0) {
                donorContributions[bountyId][donor] = 0;
                refundAmounts[i] = contrib;
                totalRefunded += contrib;
            }
        }

        emit BountyRefunded(bountyId, len, totalRefunded);

        // Transfers performed after state clearing and event emission
        for (uint256 i = 0; i < len; i++) {
            uint256 amt = refundAmounts[i];
            if (amt > 0) {
                address donor = donors[i];
                if (b.token == address(0)) {
                    (bool sent, ) = donor.call{value: amt}("");
                    if (!sent) revert NativeTransferFailed();
                } else {
                    IERC20(b.token).safeTransfer(donor, amt);
                }
            }
        }
    }

    function getDonors(uint256 bountyId) external view returns (address[] memory) {
        return _bountyDonors[bountyId];
    }

    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }

    function computeClaimHash(
        uint256 bountyId,
        bytes32 reportId,
        address cleaner,
        uint256 sigExpiry
    ) external view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                block.chainid,
                address(this),
                bountyId,
                reportId,
                cleaner,
                sigExpiry
            )
        );
    }
}
