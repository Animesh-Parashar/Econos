/**
 * TypeScript Types for Pipeline Execution
 * Defines interfaces for canvas workflow execution with L402 payment protocol
 */

export interface CanvasNode {
    id: string
    agentId: string
    agentName: string
    walletAddress: string
    endpoint: string | null
    price: string | null
    position: { x: number; y: number }
}

export interface CanvasEdge {
    id: string
    source: string
    target: string
}

export interface CanvasPipeline {
    nodes: CanvasNode[]
    edges: CanvasEdge[]
}

export interface PipelineExecutionStep {
    order: number
    nodeId: string
    agentName: string
    agentAddress: string
    endpoint: string | null
    price: string
    inputs: string[] // Node IDs that provide input
    status: 'pending' | 'running' | 'completed' | 'failed'
    result?: any
    error?: string
}

export interface PipelineExecutionPlan {
    taskId: string
    steps: PipelineExecutionStep[]
    totalCost: string
    estimatedDuration?: number
}

export interface PipelineStatus {
    taskId: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    totalSteps: number
    completedSteps: number
    currentStep?: number
    currentAgent?: string
    steps: Array<{
        order: number
        agent: string
        status: 'pending' | 'running' | 'completed' | 'failed'
    }>
}

export interface PipelineResult {
    taskId: string
    success: boolean
    status: 'completed' | 'failed'
    completedAt: number
    steps: Array<{
        order: number
        agent: string
        taskId: string
        result: any
        error?: string
    }>
    aggregatedOutput?: any
    results: any[]
}

export interface PipelineExecutionRequest {
    workflow: CanvasPipeline
    userId?: string
    metadata?: Record<string, any>
}
