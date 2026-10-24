// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {CivicHeroSBT} from "../src/CivicHeroSBT.sol";
import {BountyVault} from "../src/BountyVault.sol";

contract DeployCleanSweep is Script {
    function run() external returns (address vaultAddr, address sbtAddr) {
        uint256 deployerPrivateKey = vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);
        address verifier = vm.envOr("VERIFIER_ADDRESS", deployer);

        console.log("Deploying CleanSweep contracts with deployer:", deployer);
        console.log("Treasury:", treasury);
        console.log("Verifier:", verifier);

        vm.startBroadcast(deployerPrivateKey);

        CivicHeroSBT heroSBT = new CivicHeroSBT(
            deployer,
            "https://cleansweep.monad.xyz/api/metadata/sbt/"
        );
        sbtAddr = address(heroSBT);
        console.log("CivicHeroSBT deployed at:", sbtAddr);

        BountyVault vault = new BountyVault(
            deployer,
            treasury,
            verifier,
            sbtAddr
        );
        vaultAddr = address(vault);
        console.log("BountyVault deployed at:", vaultAddr);

        heroSBT.setBountyVault(vaultAddr);
        console.log("CivicHeroSBT bountyVault set to:", vaultAddr);

        vm.stopBroadcast();
    }
}
