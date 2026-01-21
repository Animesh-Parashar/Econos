import { Router, Request, Response } from 'express';
import { MasterAgentOrchestrator } from '../services/masterAgentOrchestrator';
import { logger } from '../utils/logger';

const router = Router();

// Initialize orchestrator (will be injected in server.ts)
let orchestrator: MasterAgentOrchestrator;

export function setOrchestrator(orc: MasterAgentOrchestrator) {
    orchestrator = orc;
}

/**
 * POST /ai/analyze
 * Analyze a natural language task and generate workflow plan
 * No payment required - just returns the plan and cost
 */
router.post('/analyze', async (req: Request, res: Response) => {
    try {
        const { taskDescription } = req.body;

        if (!taskDescription) {
            return res.status(400).json({ error: 'taskDescription is required' });
        }

        logger.info('AI analyzing task', { taskDescription });

        // Use MasterAgentOrchestrator to analyze task
        const plan = await orchestrator.analyzeTask(taskDescription);

        // Return plan with cost estimate
        res.json({
            success: true,
            plan: {
                planId: plan.planId,
                description: taskDescription,
                workflow: plan.steps.map(step => ({
                    order: step.order,
                    agent: step.serviceType,
                    description: step.description,
                })),
                estimatedCost: plan.estimatedBudgetWei,
                estimatedCostEther: (Number(plan.estimatedBudgetWei) / 1e18).toFixed(4),
                reasoning: plan.reasoning || 'AI-generated workflow',
            }
        });

    } catch (error: any) {
        logger.error('AI analyze error', { error: error.message });
        res.status(500).json({ 
            error: error.message || 'Failed to analyze task',
            details: error.toString()
        });
    }
});

/**
 * POST /ai/execute
 * Execute an AI-generated workflow with payment verification
 * Requires payment proof (transaction hash)
 */
router.post('/execute', async (req: Request, res: Response) => {
    try {
        const { taskDescription, paymentTxHash } = req.body;

        if (!taskDescription) {
            return res.status(400).json({ error: 'taskDescription is required' });
        }

        if (!paymentTxHash) {
            return res.status(400).json({ error: 'paymentTxHash is required for execution' });
        }

        logger.info('AI executing task', { taskDescription, paymentTxHash });

        // Execute workflow using MasterAgentOrchestrator  
        const result = await orchestrator.analyzeAndSubmit(taskDescription);

        // Return task ID for status polling - handles both execution types
        const taskId = result.executionType === 'single' 
            ? (result.result as any).taskId 
            : (result.result as any).taskId;

        res.json({
            success: result.success,
            taskId: taskId,
            executionType: result.executionType,
            message: 'Workflow execution started. Poll /ai/status/:taskId for updates.'
        });

    } catch (error: any) {
        logger.error('AI execute error', { error: error.message });
        res.status(500).json({ 
            error: error.message || 'Failed to execute workflow',
            details: error.toString()
        });
    }
});

/**
 * GET /ai/status/:taskId
 * Get execution status for an AI-generated workflow
 */
router.get('/status/:taskId', async (req: Request, res: Response) => {
    try {
        const taskId = Array.isArray(req.params.taskId) 
            ? req.params.taskId[0] 
            : req.params.taskId;

        // Get task status from orchestrator
        const task = await orchestrator.getTaskStatus(taskId);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({
            taskId: task.taskId,
            status: task.status,
            result: (task as any).result || null,
            error: (task as any).error || null,
            createdAt: (task as any).createdAt,
            updatedAt: (task as any).updatedAt,
        });

    } catch (error: any) {
        logger.error('AI status error', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /ai/capabilities
 * Get available worker capabilities for AI planning
 */
router.get('/capabilities', async (req: Request, res: Response) => {
    try {
        const capabilities = await orchestrator.getCapabilities();
        
        res.json({
            success: true,
            capabilities: {
                serviceCount: capabilities.services.length,
                availableServices: capabilities.availableServiceTypes,
                workers: capabilities.services.map(s => ({
                    type: (s as any).type || (s as any).serviceType || 'unknown',
                    name: s.name,
                    description: s.description,
                }))
            }
        });

    } catch (error: any) {
        logger.error('AI capabilities error', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

export default router;
