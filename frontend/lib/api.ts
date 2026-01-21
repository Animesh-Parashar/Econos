/**
 * API Service for Master Agent Communication
 * Implements L402/X402 Payment Protocol
 */

import type { Node, Edge } from 'reactflow'
import type { PipelineNodeData } from '@/types/agent'

// Master Agent API Configuration
const MASTER_AGENT_URL = process.env.NEXT_PUBLIC_MASTER_AGENT_URL || 'http://localhost:4000'

// Payment details from 402 response
export interface PaymentDetails {
    amount: string
    currency: string
    recipient: string
    chainId: number
}

// L402 Payment Response (402 Payment Required)
export interface PaymentRequiredResponse {
    status: 402
    error: string
    message: string
    paymentDetails: PaymentDetails
}

// Pipeline execution result
export interface PipelineExecutionResult {
    success: true
    taskId: string
    status: string
    message?: string
}

// Pipeline status response
export interface PipelineStatusResponse {
    taskId: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    completedSteps: number
    totalSteps: number
    currentAgent?: string
}

// Pipeline result response
export interface PipelineResultResponse {
    taskId: string
    success: boolean
    results: any[]
    aggregatedOutput?: any
}

/**
 * Convert canvas workflow to API-compatible format
 */
function serializeWorkflow(nodes: Node<PipelineNodeData>[], edges: Edge[]) {
    return {
        nodes: nodes.map(node => ({
            id: node.id,
            agentId: node.data.agent.id,
            agentName: node.data.agent.name,
            walletAddress: node.data.agent.walletAddress,
            endpoint: node.data.agent.endpoint,
            price: node.data.agent.price,
            position: node.position,
        })),
        edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
        })),
    }
}

/**
 * Step 1: Initial request to execute pipeline (expect 402)
 * This is the first call in the L402 protocol flow
 */
export async function requestPipelineExecution(
    nodes: Node<PipelineNodeData>[],
    edges: Edge[],
    taskDescription?: string
): Promise<PaymentRequiredResponse | PipelineExecutionResult> {
    const workflow = serializeWorkflow(nodes, edges)

    const response = await fetch(`${MASTER_AGENT_URL}/pipeline/execute-pipeline`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            workflow,
            taskDescription: taskDescription || 'Execute the workflow with the selected agents'
        }),
    })

    const data = await response.json()

    if (response.status === 402) {
        // Payment required - extract payment details
        return {
            status: 402,
            error: data.error || 'Payment Required',
            message: data.message || 'Please complete payment to execute pipeline',
            paymentDetails: data.paymentDetails,
        }
    }

    if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`)
    }

    return data
}

/**
 * Step 2: Retry request with payment proof (L402 header)
 * Called after user completes blockchain transaction
 */
export async function executePipelineWithPayment(
    nodes: Node<PipelineNodeData>[],
    edges: Edge[],
    txHash: string,
    taskDescription?: string
): Promise<PipelineExecutionResult> {
    const workflow = serializeWorkflow(nodes, edges)

    // Fix: The backend mounts this at /pipeline/execute-pipeline
    const response = await fetch(`${MASTER_AGENT_URL}/pipeline/execute-pipeline`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `L402 ${txHash}`, // L402 payment proof
        },
        body: JSON.stringify({ 
            workflow,
            taskDescription: taskDescription || 'Execute the workflow with the selected agents'
        }),
    })

    const data = await response.json()

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('Payment verification failed. Please ensure transaction was sent to correct address.')
        }
        throw new Error(data.error || `Execution failed: ${response.status}`)
    }

    return data
}

/**
 * Poll for pipeline execution status
 */
export async function getPipelineStatus(taskId: string): Promise<PipelineStatusResponse> {
    const response = await fetch(`${MASTER_AGENT_URL}/pipeline/${taskId}/status`)

    if (!response.ok) {
        throw new Error('Failed to fetch pipeline status')
    }

    return response.json()
}

/**
 * Retrieve final pipeline results
 */
export async function getPipelineResult(taskId: string): Promise<PipelineResultResponse> {
    const response = await fetch(`${MASTER_AGENT_URL}/pipeline/${taskId}/result`)

    if (!response.ok) {
        throw new Error('Failed to fetch pipeline results')
    }

    return response.json()
}

/**
 * Helper: Parse payment details from 402 response
 * Extracts WWW-Authenticate header if present
 */
export function parsePaymentRequired(response: PaymentRequiredResponse): PaymentDetails {
    return response.paymentDetails
}

/**
 * Helper: Poll for completion with timeout
 */
// ... (existing code)

/**
 * Poll for pipeline completion
 */
export async function waitForPipelineCompletion(
    taskId: string,
    timeoutMs: number = 300000 // 5 minutes
): Promise<PipelineResultResponse> {
    const startTime = Date.now()
    const pollInterval = 2000 // 2 seconds

    while (Date.now() - startTime < timeoutMs) {
        const status = await getPipelineStatus(taskId)

        if (status.status === 'completed') {
            return await getPipelineResult(taskId)
        }

        if (status.status === 'failed') {
            throw new Error('Pipeline execution failed')
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error('Pipeline execution timeout')
}

/**
 * Get AI Task Verification
 */
export async function getAIStatus(taskId: string): Promise<any> {
    const response = await fetch(`${MASTER_AGENT_URL}/ai/status/${taskId}`)
    
    if (!response.ok) {
        throw new Error('Failed to fetch AI task status')
    }

    return response.json()
}

/**
 * Poll for AI task completion
 */
export async function waitForAICompletion(
    taskId: string,
    timeoutMs: number = 300000
): Promise<PipelineResultResponse> {
    const startTime = Date.now()
    const pollInterval = 2000

    while (Date.now() - startTime < timeoutMs) {
        const status = await getAIStatus(taskId)

        if (status.status === 'COMPLETED' || status.status === 'completed') {
            return {
                taskId: status.taskId,
                success: true,
                results: [status.result],
                aggregatedOutput: status.result
            }
        }

        if (status.status === 'FAILED' || status.status === 'failed') {
            throw new Error(status.error || 'AI task execution failed')
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error('AI task execution timeout')
}
