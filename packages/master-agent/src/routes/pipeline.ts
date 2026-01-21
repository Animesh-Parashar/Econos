/**
 * Pipeline Execution Routes
 * L402-protected endpoints for canvas workflow execution
 */

import express, { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import {
    parseCanvasPipeline,
    executePipeline,
    getPipelineStatus,
    getPipelineResult
} from '../services/pipeline-executor';
import type { PipelineExecutionRequest } from '../types/pipeline-types';

const router = express.Router();

// Import payment guard and config from server.ts
// Note: These will be passed when mounting the router
const RPC_URL = process.env.CRONOS_RPC_URL || "https://evm-t3.cronos.org/";
const MASTER_WALLET = process.env.MASTER_WALLET_ADDRESS || process.env.MASTER_ADDRESS || "";

/**
 * L402 Payment Guard for Pipeline Execution
 * Reuses the same logic as /hire endpoint but calculates pipeline cost
 */
async function pipelinePaymentGuard(req: Request, res: Response, next: NextFunction) {
    try {
        const { workflow } = req.body as PipelineExecutionRequest;

        if (!workflow || !workflow.nodes || !workflow.edges) {
            return res.status(400).json({ error: "Missing workflow structure" });
        }

        // Calculate total cost from all nodes
        const totalCost = workflow.nodes.reduce((sum, node) => {
            return sum + parseFloat(node.price || '0.01');
        }, 0);
        const price = totalCost.toFixed(4);

        // Check for L402 Authorization header
        const authHeader = req.headers['authorization'] || req.headers['x-payment-token'];

        if (!authHeader || !String(authHeader).startsWith('L402')) {
            console.log(`🛑 Access Denied: Payment Required for pipeline (${price} TCRO)`);

            // Standard L402 Response
            res.set('WWW-Authenticate', `L402 type="transaction", amount="${price}", token="TCRO", recipient="${MASTER_WALLET}"`);
            res.status(402).json({
                error: "Payment Required",
                message: "Please pay the required amount to execute this pipeline.",
                paymentDetails: {
                    amount: price,
                    currency: "TCRO",
                    recipient: MASTER_WALLET,
                    chainId: 338 // Cronos Testnet
                }
            });
            return;
        }

        // Verify Payment
        const txHash = String(authHeader).split(' ')[1];
        console.log(`💰 Verifying pipeline payment: ${txHash}...`);

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const tx = await provider.getTransaction(txHash);

        if (!tx) {
            throw new Error("Transaction not found on chain");
        }
        if (tx.to?.toLowerCase() !== MASTER_WALLET.toLowerCase()) {
            throw new Error(`Invalid Recipient: Paid to ${tx.to}, expected ${MASTER_WALLET}`);
        }

        const paidValue = BigInt(tx.value);
        const requiredValue = ethers.parseEther(price);

        if (paidValue < requiredValue) {
            throw new Error(`Insufficient Payment: Paid ${ethers.formatEther(paidValue)}, needed ${price}`);
        }

        console.log(`✅ Pipeline Payment Verified! Starting execution.`);
        next();

    } catch (error: any) {
        console.error("❌ Payment Verification Failed:", error.message);
        res.status(403).json({ error: "Invalid Payment", details: error.message });
        return;
    }
}

/**
 * POST /execute-pipeline
 * Execute a multi-agent workflow from canvas
 * Protected by L402 payment guard
 */
router.post('/execute-pipeline', pipelinePaymentGuard, async (req: Request, res: Response) => {
    try {
        const { workflow, taskDescription } = req.body as PipelineExecutionRequest & { taskDescription?: string };

        console.log(`🚀 Executing pipeline with ${workflow.nodes.length} agents`);
        if (taskDescription) {
            console.log(`📋 Task Description: ${taskDescription}`);
        }

        // Parse workflow into execution plan
        const plan = parseCanvasPipeline(workflow);
        console.log(`📋 Execution plan created: ${plan.taskId}`);
        console.log(`💰 Total cost: ${plan.totalCost} TCRO`);

        // Start execution asynchronously (don't wait for completion)
        setImmediate(async () => {
            try {
                console.log(`⚙️ Starting asynchronous pipeline execution: ${plan.taskId}`);
                await executePipeline(plan, taskDescription);
                console.log(`✅ Pipeline ${plan.taskId} completed successfully`);
            } catch (error: any) {
                console.error(`❌ Pipeline ${plan.taskId} execution error:`, error.message);
            }
        });

        // Return immediately with task ID and 'running' status
        return res.json({
            success: true,
            taskId: plan.taskId,
            status: "running",
            message: `Pipeline execution started with ${plan.steps.length} agents${
                taskDescription ? `: ${taskDescription}` : ''
            }`,
            totalSteps: plan.steps.length,
            estimatedCost: plan.totalCost,
        });

    } catch (error: any) {
        console.error("Pipeline execution error:", error);
        return res.status(500).json({ error: error.message || "Pipeline execution failed" });
    }
});

/**
 * GET /pipeline/:taskId/status
 * Get current status of pipeline execution
 * Public endpoint - no payment required
 */
router.get('/:taskId/status', (req: Request, res: Response) => {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;

    const status = getPipelineStatus(taskId);

    if (!status) {
        return res.status(404).json({ error: "Pipeline not found" });
    }

    return res.json(status);
});

/**
 * GET /pipeline/:taskId/result
 * Get final results of completed pipeline
 * Public endpoint - no payment required
 */
router.get('/:taskId/result', (req: Request, res: Response) => {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;

    const result = getPipelineResult(taskId);

    if (!result) {
        return res.status(404).json({ error: "Pipeline result not found" });
    }

    return res.json(result);
});

export default router;
