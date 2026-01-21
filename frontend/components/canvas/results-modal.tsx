'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Clock, Copy } from 'lucide-react'
import { useState } from 'react'

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
    const [copied, setCopied] = useState(false)

    const getStatusIcon = (stepStatus: string) => {
        switch (stepStatus) {
            case 'completed':
                return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            case 'failed':
                return <XCircle className="w-4 h-4 text-rose-400" />
            case 'running':
                return <Clock className="w-4 h-4 text-blue-400 animate-spin" />
            default:
                return <Clock className="w-4 h-4 text-zinc-600" />
        }
    }

    const handleCopy = () => {
        const text = typeof aggregatedOutput === 'string' 
            ? aggregatedOutput 
            : JSON.stringify(aggregatedOutput, null, 2);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const successCount = steps.filter(s => s.status === 'completed').length;
    const failedCount = steps.filter(s => s.status === 'failed').length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden bg-zinc-900 border-zinc-800">
                <DialogHeader className="pb-4 border-b border-zinc-800">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <DialogTitle className="text-zinc-100 flex items-center gap-3 text-xl font-semibold mb-2">
                                {status === 'completed' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                                {status === 'failed' && <XCircle className="w-6 h-6 text-rose-400" />}
                                {status === 'running' && <Clock className="w-6 h-6 text-blue-400" />}
                                Workflow Results
                            </DialogTitle>
                            <p className="text-zinc-500 text-xs font-mono">
                                {taskId.slice(0, 16)}...{taskId.slice(-12)}
                            </p>
                        </div>
                        <div className="flex gap-2 text-xs">
                            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {successCount}
                            </div>
                            {failedCount > 0 && (
                                <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5" />
                                    {failedCount}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    {/* Step Results */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                            Execution Steps
                        </h3>
                        <div className="space-y-2">
                            {steps.map((step, idx) => (
                                <div 
                                    key={step.order}
                                    className="p-4 rounded-lg border bg-zinc-950 transition-all duration-200 hover:border-zinc-700"
                                    style={{
                                        borderColor: step.status === 'completed' ? 'rgba(52, 211, 153, 0.2)' : 
                                                    step.status === 'failed' ? 'rgba(251, 113, 133, 0.2)' : 
                                                    'rgba(63, 63, 70, 1)'
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                                            {step.order}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(step.status)}
                                                    <span className="font-medium text-sm text-zinc-200">
                                                        {step.agent}
                                                    </span>
                                                </div>
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                                    step.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    step.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                    step.status === 'running' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    'bg-zinc-800 text-zinc-500'
                                                }`}>
                                                    {step.status}
                                                </span>
                                            </div>
                                            
                                            {step.result && (
                                                <div className="mt-2 p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-xs text-zinc-400 max-h-40 overflow-y-auto custom-scrollbar">
                                                    <pre className="whitespace-pre-wrap font-mono">
                                                        {typeof step.result === 'string' 
                                                            ? step.result 
                                                            : JSON.stringify(step.result, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            
                                            {step.error && (
                                                <div className="mt-2 p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg text-xs text-rose-400">
                                                    <span className="font-semibold">Error:</span> {step.error}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Final Output */}
                    {aggregatedOutput && status === 'completed' && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                                Final Output
                            </h3>
                            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                                <pre className="text-xs text-zinc-300 whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar font-mono leading-relaxed">
                                    {typeof aggregatedOutput === 'string' 
                                        ? aggregatedOutput 
                                        : JSON.stringify(aggregatedOutput, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                    {aggregatedOutput && (
                        <Button
                            variant="outline"
                            onClick={handleCopy}
                            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            {copied ? 'Copied!' : 'Copy Results'}
                        </Button>
                    )}
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                        Close
                    </Button>
                </div>

                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                        height: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(39, 39, 42, 0.5);
                        border-radius: 3px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(113, 113, 122, 0.5);
                        border-radius: 3px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(161, 161, 170, 0.7);
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    )
}
