'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

interface ResultsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    taskId: string
    steps: Array<{
        order: number
        agent: string
        status: 'pending' | 'running' | 'completed' | 'failed'
        result?: any
        error?: string
    }>
    aggregatedOutput?: any
    status: 'running' | 'completed' | 'failed'
}

export function ResultsModal({ 
    open, 
    onOpenChange, 
    taskId, 
    steps, 
    aggregatedOutput,
    status 
}: ResultsModalProps) {
    const getStatusIcon = (stepStatus: string) => {
        switch (stepStatus) {
            case 'completed':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-500" />
            case 'running':
                return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
            default:
                return <Clock className="w-5 h-5 text-zinc-500" />
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto bg-zinc-900 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100 flex items-center gap-2">
                        {status === 'completed' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                        {status === 'failed' && <XCircle className="w-6 h-6 text-red-500" />}
                        {status === 'running' && <Clock className="w-6 h-6 text-blue-500" />}
                        Pipeline Execution Results
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 font-mono text-xs">
                        Task ID: {taskId.slice(0, 10)}...{taskId.slice(-8)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Step Results */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-300">Step Results</h3>
                        {steps.map((step) => (
                            <div 
                                key={step.order}
                                className="p-3 rounded-lg border border-zinc-800 bg-zinc-950"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(step.status)}
                                        <span className="font-medium text-sm text-zinc-200">
                                            Step {step.order}: {step.agent}
                                        </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                        step.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                                        step.status === 'failed' ? 'bg-red-900/30 text-red-400' :
                                        step.status === 'running' ? 'bg-blue-900/30 text-blue-400' :
                                        'bg-zinc-800 text-zinc-500'
                                    }`}>
                                        {step.status}
                                    </span>
                                </div>
                                
                                {step.result && (
                                    <div className="mt-2 p-2 bg-zinc-900 rounded text-xs text-zinc-400 max-h-32 overflow-y-auto">
                                        <pre className="whitespace-pre-wrap">
                                            {typeof step.result === 'string' 
                                                ? step.result 
                                                : JSON.stringify(step.result, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                
                                {step.error && (
                                    <div className="mt-2 p-2 bg-red-900/20 border border-red-900/50 rounded text-xs text-red-400">
                                        {step.error}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Final Output */}
                    {aggregatedOutput && status === 'completed' && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-zinc-300">Final Output</h3>
                            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                                <pre className="text-xs text-zinc-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                    {typeof aggregatedOutput === 'string' 
                                        ? aggregatedOutput 
                                        : JSON.stringify(aggregatedOutput, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    {aggregatedOutput && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                const text = typeof aggregatedOutput === 'string' 
                                    ? aggregatedOutput 
                                    : JSON.stringify(aggregatedOutput, null, 2);
                                navigator.clipboard.writeText(text);
                            }}
                            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                        >
                            Copy Results
                        </Button>
                    )}
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
