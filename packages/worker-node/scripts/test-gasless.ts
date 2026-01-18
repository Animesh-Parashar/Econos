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
    'function submitWork(bytes32 _taskId, bytes calldata _resultHash) external',
    'function tasks(bytes32) view returns (address, address, uint256, uint256, uint8)'
];

const REGISTRY_ABI = [
    'function isWorkerActive(address _worker) view returns (bool)'
];

async function main() {
    console.log('🚀 Starting Gasless Flow Test...');

    // 1. Setup Provider and Wallets
    const provider = new Provider(RPC_URL);
    
    // Master needs funds to deposit task
    const masterWallet = new Wallet(process.env.MASTER_PRIVATE_KEY!, provider);
    // Worker can have 0 ETH/zkTCRO if Paymaster works!
    const workerWallet = new Wallet(process.env.WORKER_PRIVATE_KEY!, provider);

    console.log(`👤 Master: ${masterWallet.address}`);
    console.log(`👷 Worker: ${workerWallet.address}`);

    // 2. Connect Contracts
    const escrowMaster = new Contract(ESCROW_ADDRESS, ESCROW_ABI, masterWallet);
    const escrowWorker = new Contract(ESCROW_ADDRESS, ESCROW_ABI, workerWallet);
    const registry = new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);

    

    // --- PRE-CHECK ---
    const isActive = await registry.isWorkerActive(workerWallet.address);
    if (!isActive) {
        console.error('❌ Worker is NOT active in registry. Register worker first!');
        process.exit(1);
    }
    console.log('✅ Worker is active');

    // 3. Generate Task Data
    const taskId = ethers.hexlify(ethers.randomBytes(32)); // Unique bytes32 ID
    const duration = 3600; // 1 hour
    const paymentAmount = ethers.parseEther("0.001"); // 0.001 zkTCRO

    console.log(`\n--- PHASE 1: DEPOSIT (Master) ---`);
    console.log(`Task ID: ${taskId}`);
    
    try {
        const tx = await escrowMaster.depositTask(taskId, workerWallet.address, duration, {
            value: paymentAmount
        });
        console.log(`⏳ Deposit sent: ${tx.hash}`);
        await tx.wait();
        console.log(`✅ Deposit confirmed.`);
    } catch (e) {
        console.error('❌ Deposit failed:', e);
        process.exit(1);
    }

    // --- PHASE 2: AUTH SIGNING (Off-Chain) ---
    // (Simulating the Master signing the authorization)
    console.log(`\n--- PHASE 2: AUTHORIZATION (Off-Chain) ---`);
    const domain = {
        name: 'Econos Master Agent',
        version: '1',
        chainId: (await provider.getNetwork()).chainId,
        verifyingContract: ESCROW_ADDRESS
    };
    
    const types = {
        TaskAuthorization: [
            { name: 'taskId', type: 'bytes32' },
            { name: 'worker', type: 'address' },
            { name: 'expiresAt', type: 'uint256' },
            { name: 'nonce', type: 'uint256' }
        ]
    };

    const authMessage = {
        taskId: taskId,
        worker: workerWallet.address,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        nonce: 1
    };

    // Note: zksync-ethers Wallet has standard signTypedData
    const signature = await masterWallet.signTypedData(domain, types, authMessage);
    console.log(`✅ EIP-712 Signature generated: ${signature.slice(0, 20)}...`);


    // --- PHASE 3: SUBMIT WORK (Worker + Paymaster) ---
    console.log(`\n--- PHASE 3: EXECUTION (Worker + Paymaster) ---`);
    
    // Check Worker Balance before (Should not decrease)
    const balanceBefore = await provider.getBalance(workerWallet.address);
    console.log(`💰 Worker Balance Before: ${ethers.formatEther(balanceBefore)} zkTCRO`);

    const resultString = "Image generated successfully: ipfs://QmHash...";
    const resultBytes = ethers.toUtf8Bytes(resultString); // Convert to bytes for contract

    // Prepare Paymaster Params
    const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
        type: 'General',
        innerInput: new Uint8Array() // Empty for general flow
    });

    try {
        // Send Gasless Transaction
        const submitTx = await escrowWorker.submitWork(taskId, resultBytes, {
            customData: {
                gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                paymasterParams: paymasterParams
            }
        });

        console.log(`⏳ SubmitWork sent (Gasless): ${submitTx.hash}`);
        const receipt = await submitTx.wait();
        
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    } catch (e: any) {
        console.error('❌ Gasless submission failed!');
        if (e.message.includes("failed paymaster validation")) {
            console.error("Reason: Paymaster validation failed (Check Paymaster ETH balance or Selector)");
        } else {
            console.error(e);
        }
        process.exit(1);
    }

    // --- PHASE 4: VERIFICATION ---
    console.log(`\n--- PHASE 4: VERIFICATION ---`);
    
    const balanceAfter = await provider.getBalance(workerWallet.address);
    console.log(`💰 Worker Balance After:  ${ethers.formatEther(balanceAfter)} zkTCRO`);

    // Allow for tiny variance due to internal tx costs if any, but usually it's exact
    if (balanceBefore === balanceAfter) {
        console.log(`🎉 SUCCESS! Worker balance did not change. Paymaster covered gas.`);
    } else {
        const diff = balanceBefore - balanceAfter;
        // Sometimes tiny amounts are used for storage writes depending on zkSync version
        if (diff < ethers.parseEther("0.000001")) { 
             console.log(`🎉 SUCCESS! Worker paid negligible/zero gas.`);
        } else {
             console.log(`⚠️ WARNING: Worker balance decreased by ${ethers.formatEther(diff)}. Paymaster might not have worked fully.`);
        }
    }

    const taskState = await escrowMaster.tasks(taskId);
    if (Number(taskState[4]) === 1) { // 1 = COMPLETED
        console.log(`✅ On-Chain Task Status: COMPLETED`);
    } else {
        console.error(`❌ Task Status incorrect: ${taskState[4]}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});