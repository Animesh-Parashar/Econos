import { Provider, Wallet, Contract, utils } from 'zksync-ethers';
import { ethers } from 'ethers';
import 'dotenv/config';

// --- CONFIGURATION ---
const RPC_URL = process.env.CRONOS_RPC_URL || 'https://testnet.zkevm.cronos.org';
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS!;
const PAYMASTER_ADDRESS = process.env.PAYMASTER_ADDRESS!;
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS!;

// --- ABIs ---
const ESCROW_ABI = [
    'function depositTask(bytes32 _taskId, address _worker, uint256 _duration) external payable',
    // We explicitly define this to match the selector we expect
    'function submitWork(bytes32 _taskId, bytes calldata _resultHash) external',
    'function tasks(bytes32) view returns (address, address, uint256, uint256, uint8)',
    'function registry() view returns (address)'
];

const PAYMASTER_ABI = [
    'function escrowContract() view returns (address)',
    'function owner() view returns (address)'
];

const REGISTRY_ABI = [
    'function isWorkerActive(address _worker) view returns (bool)'
];

async function main() {
    console.log('🕵️‍♀️ STARTING DIAGNOSTIC MODE...');
    console.log('------------------------------------------------');

    // 1. Setup Provider
    const provider = new Provider(RPC_URL);
    const workerWallet = new Wallet(process.env.WORKER_PRIVATE_KEY!, provider);
    const masterWallet = new Wallet(process.env.MASTER_PRIVATE_KEY!, provider);

    // ---------------------------------------------------------
    // DIAGNOSTIC BLOCK
    // ---------------------------------------------------------
    
    console.log(`🔍 CHECKING CONFIGURATION:`);
    console.log(`   Worker:    ${workerWallet.address}`);
    console.log(`   Paymaster: ${PAYMASTER_ADDRESS}`);
    console.log(`   Escrow:    ${ESCROW_ADDRESS}`);

    // CHECK 1: Paymaster Solvency
    const pmBalance = await provider.getBalance(PAYMASTER_ADDRESS);
    const pmBalanceEth = ethers.formatEther(pmBalance);
    console.log(`\n💰 CHECK 1: Paymaster Balance`);
    if (pmBalance === 0n) {
        console.error(`   ❌ FAIL: Paymaster has 0 zkTCRO. It cannot pay for gas.`);
        console.log(`   👉 FIX: Run: cast send ${PAYMASTER_ADDRESS} --value 1ether --rpc-url ${RPC_URL} --private-key $MASTER_PRIVATE_KEY`);
        process.exit(1);
    } else {
        console.log(`   ✅ PASS: Balance is ${pmBalanceEth} zkTCRO`);
    }

    // CHECK 2: Paymaster Linkage
    const pmContract = new Contract(PAYMASTER_ADDRESS, PAYMASTER_ABI, provider);
    try {
        const linkedEscrow = await pmContract.escrowContract();
        console.log(`\n🔗 CHECK 2: Paymaster Target Link`);
        console.log(`   Paymaster thinks Escrow is: ${linkedEscrow}`);
        console.log(`   Your .env says Escrow is:   ${ESCROW_ADDRESS}`);
        
        if (linkedEscrow.toLowerCase() !== ESCROW_ADDRESS.toLowerCase()) {
            console.error(`   ❌ FAIL: Address Mismatch! Paymaster will reject calls to your .env address.`);
            console.log(`   👉 FIX: Update .env to use ${linkedEscrow} OR redeploy Paymaster with ${ESCROW_ADDRESS}`);
            process.exit(1);
        } else {
            console.log(`   ✅ PASS: Addresses match.`);
        }
    } catch (e) {
        console.error(`   ❌ FAIL: Could not read 'escrowContract()' from Paymaster. Is the ABI correct?`);
    }

    // CHECK 3: Function Selector
    // We calculate what 'submitWork(bytes32,bytes)' looks like in hex
    const signature = "submitWork(bytes32,bytes)";
    const selector = ethers.id(signature).slice(0, 10); // First 4 bytes + 0x
    console.log(`\n🧩 CHECK 3: Function Selector`);
    console.log(`   Target Function: "${signature}"`);
    console.log(`   Calculated Selector: ${selector}`);
    console.log(`   Paymaster Expects:   0x828efc0c`);
    
    if (selector !== "0x828efc0c") {
        console.error(`   ❌ FAIL: Selector mismatch! The contract logic expects 'bytes' but we calculated something else.`);
        // This shouldn't happen if the string above is correct, but confirms our assumption.
        process.exit(1);
    } else {
        console.log(`   ✅ PASS: Selector matches hardcoded check.`);
    }

    console.log('\n------------------------------------------------');
    console.log('✅ DIAGNOSTICS PASSED. ATTEMPTING TRANSACTION...');
    console.log('------------------------------------------------');

    // ---------------------------------------------------------
    // EXECUTION BLOCK
    // ---------------------------------------------------------

    const escrowMaster = new Contract(ESCROW_ADDRESS, ESCROW_ABI, masterWallet);
    const escrowWorker = new Contract(ESCROW_ADDRESS, ESCROW_ABI, workerWallet);
    const registry = new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);

    // Ensure Worker is Active
    const isActive = await registry.isWorkerActive(workerWallet.address);
    if (!isActive) {
        console.error('\n❌ EXECUTION HALTED: Worker is not active in registry.');
        process.exit(1);
    }

    // Phase 1: Deposit (Standard TX)
    const taskId = ethers.hexlify(ethers.randomBytes(32));
    console.log(`\n1️⃣  Depositing Task: ${taskId}`);
    try {
        const tx = await escrowMaster.depositTask(taskId, workerWallet.address, 3600, {
            value: ethers.parseEther("0.0001")
        });
        await tx.wait();
        console.log(`   ✅ Deposit Confirmed`);
    } catch (e: any) {
        console.error(`   ❌ Deposit Failed:`, e.reason || e.message);
        process.exit(1);
    }

    // Phase 2: Submit Gasless (The Test)
    console.log(`\n2️⃣  Submitting Result (Gasless)`);
    const resultBytes = ethers.toUtf8Bytes("success");
    
    // Construct Paymaster Params
    const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
        type: 'General',
        innerInput: new Uint8Array()
    });

    try {
        // Estimate Gas first to catch revert reasons early
        // Note: zksync-ethers usually handles this in sendTransaction, but explicit helps debugging
        const gasLimit = await escrowWorker.submitWork.estimateGas(taskId, resultBytes, {
            customData: {
                gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                paymasterParams: paymasterParams
            }
        });
        console.log(`   ⛽ Estimated Gas Limit: ${gasLimit.toString()}`);

        const submitTx = await escrowWorker.submitWork(taskId, resultBytes, {
            customData: {
                gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                paymasterParams: paymasterParams
            }
        });

        console.log(`   ⏳ Transaction Sent: ${submitTx.hash}`);
        const receipt = await submitTx.wait();
        console.log(`   ✅ Transaction Mined! Block: ${receipt.blockNumber}`);
        console.log(`   🎉 SUCCESS: Gasless flow works.`);

    } catch (e: any) {
        console.log('\n🔴 TRANSACTION FAILED DETAILS:');
        console.log('-----------------------------');
        if (e.message.includes("failed paymaster validation")) {
            console.error("👉 ERROR: PAYMASTER VALIDATION FAILED");
            console.error("   Reason: The Paymaster contract `validateAndPayForPaymasterTransaction` returned false or reverted.");
            console.error("   Most likely: Paymaster balance ran out OR 'invalid target' check failed.");
        } else if (e.data) {
            console.error(`   Encoded Error Data: ${e.data}`);
            // Try to decode if it's a string revert
            try {
                const decoded = ethers.toUtf8String('0x' + e.data.slice(138));
                console.error(`   Decoded Revert Reason: ${decoded}`);
            } catch (err) {
                console.error(`   (Could not decode raw data)`);
            }
        } else {
            console.error(`   Error Message: ${e.message}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});