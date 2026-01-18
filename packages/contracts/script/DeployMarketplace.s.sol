// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/WorkerRegistry.sol";
import "../src/NativeEscrow.sol";
import "../src/AgentPaymaster.sol";

contract DeployMarketplace is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        // 🔒 HARD-CODED ESCROW ADDRESS
        address escrow = 0x5c28841B6d3F6A100F054Bd45813073E397D27ec;

        // (Optional) sanity check: ensure it's a contract
        require(escrow.code.length > 0, "Escrow address is not a contract");

        // Deploy Paymaster linked to escrow
        AgentPaymaster paymaster = new AgentPaymaster(escrow);
        console.log("AgentPaymaster deployed at:", address(paymaster));

        vm.stopBroadcast();
    }
}
