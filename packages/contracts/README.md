# 🛡️ Cronos zkEVM Agent Marketplace

A decentralized, gasless Agent-to-Agent marketplace built on Cronos zkEVM. This system uses **Native Account Abstraction (Paymasters)** to allow AI agents to execute tasks without holding gas tokens, secured by an on-chain **Escrow** and **Reputation** system.

## 🏗 Architecture

1. **`WorkerRegistry.sol`**: On-chain identity and reputation management for agents.
2. **`NativeEscrow.sol`**: Holds `zkTCRO` payments securely until tasks are verified.
3. **`AgentPaymaster.sol`**: A custom zkEVM Paymaster that sponsors gas fees for valid worker submissions.

---

## 🚀 Prerequisites

You **cannot** use standard Foundry for this project. You must use the **ZKsync fork** of Foundry to support Cronos zkEVM features.

### 1. Install Foundry-ZKsync

If you have standard foundry installed, don't worry `foundryup-zksync` manages the switch easily.

```bash
# Download the installer
curl -L https://raw.githubusercontent.com/matter-labs/foundry-zksync/main/install-foundry-zksync | bash

# Install the ZKsync toolchain
foundryup-zksync

# Verify installation (should mention zksync)
forge --version

```

### 2. Clone & Install Dependencies

```bash
# If initializing a new folder
forge init --force

# Install standard libraries
forge install openzeppelin/openzeppelin-contracts --no-commit

# Install ZKsync system contracts (REQUIRED for Paymaster)
forge install matter-labs/era-contracts --no-commit

```

---

## ⚙️ Configuration

### 1. Configure `foundry.toml`

Ensure your configuration enables ZK compilation and system contract extensions.

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.20"
evm_version = "cancun"

[profile.default.zksync]
compile = true
startup = true
enable_eravm_extensions = true # Required for Paymaster

[rpc_endpoints]
cronos_testnet = "https://testnet.zkevm.cronos.org"

[etherscan]
cronos_testnet = { key = "EMPTY", url = "https://explorer.zkevm.cronos.org/testnet/api" }

```

### 2. Set Environment Variables

Create a `.env` file in the root directory:

```ini
# Your Deployer Private Key (Must have zkTCRO for funding Paymaster)
PRIVATE_KEY=0x...

# A separate key for testing the Worker flow
WORKER_KEY=0x...

# RPC URL
RPC_URL=https://testnet.zkevm.cronos.org

```

---

## 🛠 Compilation & Testing

### Compile Contracts

```bash
# The --zksync flag is mandatory
forge build --zksync
```

### Run Tests

We use `forge-zksync-std` to simulate zkEVM behavior (like Paymasters) locally.

```bash
forge test --zksync --gas-report

```

---

## 🚢 Deployment

We use a Solidity script to deploy the Registry, Escrow, and Paymaster in the correct order and link them together.

### 1. Create the Deploy Script

Ensure `script/DeployMarketplace.s.sol` exists .

### 2. Run Deployment

This command deploys all contracts and verifies them on the explorer.

```bash
source .env

forge script script/DeployMarketplace.s.sol \
  --rpc-url cronos_testnet \
  --chain-id 240 \
  --zksync \
  --broadcast \
  --verify \
  --verifier zksync \
  --verifier-url https://explorer.zkevm.cronos.org/testnet/contract_verification

```

**Output will look like:**

```text
WorkerRegistry: 0x...
NativeEscrow:   0x...
AgentPaymaster: 0x...

```

*Save these addresses! You will need them for your frontend/sidecar.*

---

## 🤖 Usage (Manual Interaction)

You can interact with your contracts using `cast`.

### 1. Register a Worker

```bash
# 1. Create a metadata hash (simulated)
CID=$(cast bytes32 "ipfs://QmYourMetadataHash")

# 2. Register
cast send <REGISTRY_ADDR> "register(bytes32)" $CID \
  --rpc-url cronos_testnet \
  --private-key $WORKER_KEY

```

### 2. Deposit a Task (As Master)

```bash
# Deposit 0.01 zkTCRO for a task
cast send <ESCROW_ADDR> "depositTask(bytes32,address,uint256)" \
  $(cast bytes32 "task-1") \
  <WORKER_ADDR> \
  3600 \
  --value 0.01ether \
  --rpc-url cronos_testnet \
  --private-key $PRIVATE_KEY

```

### 3. Submit Work (Gasless via Paymaster)

This is the magic step. The worker pays **0 gas**.

```bash
# 1. Prepare Calldata
DATA=$(cast calldata "submitWork(bytes32,string)" $(cast bytes32 "task-1") "ipfs://ResultHash")

# 2. Send with Paymaster Params
# Note: paymaster-input is "0x" because our paymaster uses general flow
cast send <ESCROW_ADDR> \
  --rpc-url cronos_testnet \
  --private-key $WORKER_KEY \
  --data $DATA \
  --zk-paymaster-address <PAYMASTER_ADDR> \
  --zk-paymaster-input "0x"

```

---

## 🔧 Troubleshooting

* **Error**: `Project root contains non-empty directories`:   
Run `forge init --force`.  

* **Error**: `Paymaster validation failed`:   
Ensure your `AgentPaymaster` is funded with zkTCRO.  

* **Error**: `eravm extensions disabled`:   
Check that `enable_eravm_extensions = true` is set in your `foundry.toml`.