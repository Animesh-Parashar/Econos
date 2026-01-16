// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {Transaction} from "@matterlabs/zksync-contracts/libraries/TransactionHelper.sol";
import {IPaymaster, ExecutionResult, PAYMASTER_VALIDATION_SUCCESS_MAGIC} from "@matterlabs/zksync-contracts/interfaces/IPaymaster.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interface to peek into the Escrow contract
interface IEscrowReader {
    function tasks(bytes32) external view returns (address, address, uint256, uint256, uint8);
}

contract AgentPaymaster is IPaymaster {
    address public escrowContract;
    address public owner;

    // The standardized bootloader address in ZK Stack
    address constant BOOTLOADER_ADDRESS = 0x0000000000000000000000000000000000008001;

    constructor(address _escrow) {
        escrowContract = _escrow;
        owner = msg.sender;
    }

    modifier onlyBootloader() {
        require(msg.sender == BOOTLOADER_ADDRESS, "Only bootloader can call this");
        _;
    }

    /**
     * @notice The Heart of the Gasless Logic
     */
    function validateAndPayForPaymasterTransaction(
        bytes32,
        bytes32,
        Transaction calldata _transaction
    ) external payable override onlyBootloader returns (bytes4 magic, bytes memory context) {
        // 1. SECURITY: Ensure interaction is with OUR Escrow Contract
        require(address(uint160(_transaction.to)) == escrowContract, "Invalid target contract");

        // 2. LOGIC: Decode calldata to ensure it is 'submitWork' and check assignments
        // submitWork signature: 0xea801663 (calculated via keccak256("submitWork(bytes32,string)"))
        // We verify the first 4 bytes
        require(bytes4(_transaction.data[0:4]) == 0xea801663, "Only submitWork allowed");

        // Decode the Task ID (skip 4 bytes selector, take next 32 bytes)
        bytes32 taskId = abi.decode(_transaction.data[4:36], (bytes32));

        // 3. VERIFICATION: Call Escrow to check if sender is the assigned worker
        // Note: 'tasks' returns a tuple. We need the 2nd item (worker address).
        // (master, worker, amount, deadline, status)
        (, address assignedWorker, , , ) = IEscrowReader(escrowContract).tasks(taskId);

        address sender = address(uint160(_transaction.from));
        require(sender == assignedWorker, "Paymaster: Sender is not the assigned worker");

        // 4. PAYMENT: Pay the bootloader for the gas
        uint256 requiredETH = _transaction.gasLimit * _transaction.maxFeePerGas;
        
        // Note: The Paymaster contract itself must hold zkTCRO to pay this
        (bool success, ) = payable(BOOTLOADER_ADDRESS).call{value: requiredETH}("");
        require(success, "Failed to pay bootloader");

        return (PAYMASTER_VALIDATION_SUCCESS_MAGIC, new bytes(0));
    }

    function postTransaction(
        bytes calldata _context,
        Transaction calldata _transaction,
        bytes32,
        bytes32,
        ExecutionResult _txResult,
        uint256 _maxRefundedGas
    ) external payable override onlyBootloader {
        // Optional: Refunds for unused gas automatically handled by bootloader
    }

    // Allow the admin to fund the gas tank
    receive() external payable {}

    // Allow admin to withdraw gas funds if needed
    function withdraw(address payable _to) external {
        require(msg.sender == owner, "Auth failed");
        
        (bool success, ) = _to.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
}