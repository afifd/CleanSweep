// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {BountyVault} from "../src/BountyVault.sol";
import {CivicHeroSBT} from "../src/CivicHeroSBT.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract BountyVaultTest is Test {
    using MessageHashUtils for bytes32;

    BountyVault public vault;
    CivicHeroSBT public heroSBT;
    MockERC20 public token;

    address public owner = makeAddr("owner");
    address public treasury = makeAddr("treasury");
    uint256 public verifierPrivateKey = 0xA11CE;
    address public verifier;

    address public reporter = makeAddr("reporter");
    address public donor1 = makeAddr("donor1");
    address public donor2 = makeAddr("donor2");
    address public cleaner = makeAddr("cleaner");
    address public attacker = makeAddr("attacker");

    bytes32 public sampleReportId = keccak256("report-jakarta-sudirman-banner-001");

    function setUp() public {
        verifier = vm.addr(verifierPrivateKey);

        vm.startPrank(owner);
        heroSBT = new CivicHeroSBT(owner, "https://api.cleansweep.civic/metadata/");
        vault = new BountyVault(owner, treasury, verifier, address(heroSBT));
        heroSBT.setBountyVault(address(vault));
        vm.stopPrank();

        token = new MockERC20();

        // Fund accounts
        vm.deal(reporter, 10 ether);
        vm.deal(donor1, 10 ether);
        vm.deal(donor2, 10 ether);
        vm.deal(cleaner, 1 ether);
        vm.deal(attacker, 1 ether);

        token.mint(reporter, 1000 ether);
        token.mint(donor1, 1000 ether);
        token.mint(donor2, 1000 ether);
    }

    function _signClaim(
        uint256 bountyId,
        bytes32 reportId,
        address cleanerAddr,
        uint256 sigExpiry
    ) internal view returns (bytes memory) {
        bytes32 claimHash = keccak256(
            abi.encodePacked(
                block.chainid,
                address(vault),
                bountyId,
                reportId,
                cleanerAddr,
                sigExpiry
            )
        );
        bytes32 ethHash = claimHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(verifierPrivateKey, ethHash);
        return abi.encodePacked(r, s, v);
    }

    function test_CreateAndBoostNativeBounty() public {
        vm.prank(reporter);
        uint256 bountyId = vault.createBounty{value: 1 ether}(
            sampleReportId,
            address(0),
            0,
            7 days
        );

        assertEq(bountyId, 1);
        BountyVault.Bounty memory b = vault.getBounty(1);
        assertEq(b.totalPool, 1 ether);
        assertEq(b.donorCount, 1);
        assertEq(uint(b.status), uint(BountyVault.BountyStatus.Active));

        // Neighbor 1 boosts
        vm.prank(donor1);
        vault.boostBounty{value: 0.5 ether}(1, 0);

        // Neighbor 2 boosts
        vm.prank(donor2);
        vault.boostBounty{value: 0.5 ether}(1, 0);

        b = vault.getBounty(1);
        assertEq(b.totalPool, 2 ether);
        assertEq(b.donorCount, 3);
        assertEq(vault.donorContributions(1, reporter), 1 ether);
        assertEq(vault.donorContributions(1, donor1), 0.5 ether);
        assertEq(vault.donorContributions(1, donor2), 0.5 ether);
    }

    function test_ClaimNativeBountyWithSignatureAndMintSBT() public {
        vm.prank(reporter);
        uint256 bountyId = vault.createBounty{value: 2 ether}(
            sampleReportId,
            address(0),
            0,
            7 days
        );

        uint256 sigExpiry = block.timestamp + 1 hours;
        bytes memory signature = _signClaim(bountyId, sampleReportId, cleaner, sigExpiry);

        uint256 preTreasury = treasury.balance;
        uint256 preCleaner = cleaner.balance;

        vault.claimBounty(bountyId, cleaner, sigExpiry, signature);

        BountyVault.Bounty memory b = vault.getBounty(bountyId);
        assertEq(uint(b.status), uint(BountyVault.BountyStatus.Claimed));
        assertEq(b.cleaner, cleaner);

        // 2.5% fee on 2 ETH = 0.05 ETH
        // Net cleaner payout = 1.95 ETH
        assertEq(treasury.balance - preTreasury, 0.05 ether);
        assertEq(cleaner.balance - preCleaner, 1.95 ether);

        // SBT awarded
        assertTrue(heroSBT.hasHeroBadge(cleaner));
        assertEq(heroSBT.ownerOf(1), cleaner);
    }

    function test_RejectClaimWithInvalidSignature() public {
        vm.prank(reporter);
        uint256 bountyId = vault.createBounty{value: 1 ether}(
            sampleReportId,
            address(0),
            0,
            7 days
        );

        uint256 sigExpiry = block.timestamp + 1 hours;

        // Attacker signs instead of authorized verifier
        bytes32 claimHash = keccak256(
            abi.encodePacked(
                block.chainid,
                address(vault),
                bountyId,
                sampleReportId,
                attacker,
                sigExpiry
            )
        );
        bytes32 ethHash = claimHash.toEthSignedMessageHash();
        uint256 rogueKey = 0xBAD;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(rogueKey, ethHash);
        bytes memory badSignature = abi.encodePacked(r, s, v);

        vm.expectRevert(BountyVault.InvalidSignature.selector);
        vault.claimBounty(bountyId, attacker, sigExpiry, badSignature);
    }

    function test_RejectReplayClaim() public {
        vm.prank(reporter);
        uint256 bountyId = vault.createBounty{value: 1 ether}(
            sampleReportId,
            address(0),
            0,
            7 days
        );

        uint256 sigExpiry = block.timestamp + 1 hours;
        bytes memory signature = _signClaim(bountyId, sampleReportId, cleaner, sigExpiry);

        vault.claimBounty(bountyId, cleaner, sigExpiry, signature);

        // Second attempt fails
        vm.expectRevert(BountyVault.BountyNotActive.selector);
        vault.claimBounty(bountyId, cleaner, sigExpiry, signature);
    }

    function test_RefundExpiredBountyToMultiDonors() public {
        vm.prank(reporter);
        uint256 bountyId = vault.createBounty{value: 1 ether}(
            sampleReportId,
            address(0),
            0,
            3 days
        );

        vm.prank(donor1);
        vault.boostBounty{value: 0.5 ether}(bountyId, 0);

        vm.prank(donor2);
        vault.boostBounty{value: 0.25 ether}(bountyId, 0);

        // Cannot refund before deadline
        vm.expectRevert(BountyVault.BountyNotExpired.selector);
        vault.refundBounty(bountyId);

        // Advance time past deadline
        vm.warp(block.timestamp + 3 days + 1);

        uint256 repPre = reporter.balance;
        uint256 d1Pre = donor1.balance;
        uint256 d2Pre = donor2.balance;

        // Anyone triggers refund
        vault.refundBounty(bountyId);

        assertEq(reporter.balance - repPre, 1 ether);
        assertEq(donor1.balance - d1Pre, 0.5 ether);
        assertEq(donor2.balance - d2Pre, 0.25 ether);

        BountyVault.Bounty memory b = vault.getBounty(bountyId);
        assertEq(uint(b.status), uint(BountyVault.BountyStatus.Refunded));
    }

    function test_ERC20BountyLifecycle() public {
        vm.startPrank(reporter);
        token.approve(address(vault), 100 ether);
        uint256 bountyId = vault.createBounty(
            keccak256("usdc-bounty-report"),
            address(token),
            100 ether,
            7 days
        );
        vm.stopPrank();

        vm.startPrank(donor1);
        token.approve(address(vault), 50 ether);
        vault.boostBounty(bountyId, 50 ether);
        vm.stopPrank();

        uint256 sigExpiry = block.timestamp + 1 hours;
        bytes memory signature = _signClaim(bountyId, keccak256("usdc-bounty-report"), cleaner, sigExpiry);

        vault.claimBounty(bountyId, cleaner, sigExpiry, signature);

        // Total 150 tokens. 2.5% fee = 3.75 tokens. Net cleaner = 146.25 tokens
        assertEq(token.balanceOf(treasury), 3.75 ether);
        assertEq(token.balanceOf(cleaner), 146.25 ether);
    }

    function test_SoulboundTokenCannotBeTransferred() public {
        vm.prank(reporter);
        uint256 bountyId = vault.createBounty{value: 1 ether}(
            sampleReportId,
            address(0),
            0,
            7 days
        );

        uint256 sigExpiry = block.timestamp + 1 hours;
        bytes memory signature = _signClaim(bountyId, sampleReportId, cleaner, sigExpiry);
        vault.claimBounty(bountyId, cleaner, sigExpiry, signature);

        assertEq(heroSBT.ownerOf(1), cleaner);

        // Cleaner tries to transfer SBT to attacker -> reverts
        vm.prank(cleaner);
        vm.expectRevert(CivicHeroSBT.SoulboundTransferBlocked.selector);
        heroSBT.transferFrom(cleaner, attacker, 1);
    }
}
