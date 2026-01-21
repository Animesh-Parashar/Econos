'use client'

import { useEffect, useRef, useState } from 'react'
import { Terminal, X, Maximize2, Minimize2 } from 'lucide-react'

interface LogEntry {
    timestamp: string
    level: 'info' | 'success' | 'error' | 'warning'
    message: string
}

interface ExecutionLogProps {
    taskId: string | null
    isExecuting: boolean
}

export function ExecutionLog({ taskId, isExecuting }: ExecutionLogProps) {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [isExpanded, setIsExpanded] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const logEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    // Show log when execution starts
    useEffect(() => {
        if (isExecuting && !isVisible) {
            setIsVisible(true)
        }
    }, [isExecuting])

    // Poll backend status and generate logs
    useEffect(() => {
        if (!taskId) return

        const addLog = (level: LogEntry['level'], message: string) => {
            setLogs(prev => {
                // Avoid duplicate messages
                if (prev.some(log => log.message === message)) return prev
                return [...prev, {
                    timestamp: new Date().toLocaleTimeString(),
                    level,
                    message
                }]
            })
        }

        const pollStatus = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_MASTER_AGENT_URL || 'http://localhost:4000'}/pipeline/${taskId}/status`
                )
                
                if (response.ok) {
                    const data = await response.json()
                    
                    // Generate logs from status
                    if (data.status === 'running') {
                        data.steps?.forEach((step: any, idx: number) => {
                            if (step.status === 'completed') {
                                addLog('success', `✅ Step ${idx + 1}: ${step.agent} completed`)
                            } else if (step.status === 'failed') {
                                addLog('error', `❌ Step ${idx + 1}: ${step.agent} failed`)
                            } else if (step.status === 'running') {
                                addLog('info', `⚙️ Executing Step ${idx + 1}: ${step.agent}...`)
                            }
                        })
                    } else if (data.status === 'completed') {
                        addLog('success', '🎉 Pipeline completed successfully!')
                    } else if (data.status === 'failed') {
                        addLog('error', '💥 Pipeline execution failed')
                    }
                }
            } catch (error) {
                console.error('Status polling error:', error)
            }
        }

        // Initial log
        addLog('info', `🚀 Starting pipeline ${taskId.slice(0, 12)}...`)
        
        // Start polling
        pollStatus()
        
        if (isExecuting) {
            const interval = setInterval(pollStatus, 2000)
            return () => clearInterval(interval)
        }
    }, [taskId, isExecuting])

    if (!isVisible) return null

    const getLevelColor = (level: LogEntry['level']) => {
        switch (level) {
            case 'success': return 'text-emerald-400'
            case 'error': return 'text-rose-400'
            case 'warning': return 'text-amber-400'
            default: return 'text-blue-400'
        }
    }

    return (
        <div 
            className={`fixed right-4 transition-all duration-300 z-30 ${
                isExpanded ? 'bottom-4 w-[600px] h-[400px]' : 'bottom-4 w-96 h-64'
            }`}
        >
            <div className="h-full flex flex-col bg-zinc-950/95 backdrop-blur-md border border-zinc-800/50 rounded-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800/50">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-zinc-400" />
                        <span className="text-xs font-semibold text-zinc-300">Execution Log</span>
                        <span className="text-xs text-zinc-600">|</span>
                        <span className={`text-xs ${isExecuting ? 'text-blue-400 animate-pulse' : 'text-zinc-500'}`}>
                            {isExecuting ? '● Running' : '○ Idle'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-zinc-800 rounded transition-colors"
                        >
                            {isExpanded ? (
                                <Minimize2 className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                                <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setIsVisible(false)
                                setLogs([])
                            }}
                            className="p-1 hover:bg-zinc-800 rounded transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-zinc-400" />
                        </button>
                    </div>
                </div>

                {/* Log content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-zinc-600">
                            Waiting for execution...
                        </div>
                    ) : (
                        logs.map((log, idx) => (
                            <div key={idx} className="flex gap-2">
                                <span className="text-zinc-600 flex-shrink-0">{log.timestamp}</span>
                                <span className={`${getLevelColor(log.level)} flex-1`}>
                                    {log.message}
                                </span>
                            </div>
                        ))
                    )}
                    <div ref={logEndRef} />
                </div>

                {/* Footer */}
                <div className="px-3 py-1.5 bg-zinc-900/50 border-t border-zinc-800/50 text-xs text-zinc-600">
                    {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
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
        </div>
    )
}
