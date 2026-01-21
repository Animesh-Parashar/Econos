'use client'

import { User, Bot, CheckCircle2, Clock } from 'lucide-react'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    workflow?: {
        agents: string[]
        cost: string
    }
    isLoading?: boolean
}

interface ChatMessageProps {
    message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user'

    return (
        <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                </div>
            )}
            
            <div className={`flex-1 max-w-[80%] ${isUser ? 'flex justify-end' : ''}`}>
                <div className={`px-4 py-3 rounded-xl ${
                    isUser 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-200'
                }`}>
                    {message.isLoading ? (
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 animate-spin" />
                            <span className="text-sm">{message.content}</span>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            
                            {message.workflow && (
                                <div className="mt-3 pt-3 border-t border-zinc-700/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span className="text-xs font-semibold text-zinc-400">Workflow Plan</span>
                                    </div>
                                    <div className="space-y-1">
                                        {message.workflow.agents.map((agent, idx) => (
                                            <div key={idx} className="text-xs text-zinc-500 flex items-center gap-2">
                                                <span className="w-5 h-5 rounded bg-zinc-700/50 flex items-center justify-center text-zinc-400 font-mono">
                                                    {idx + 1}
                                                </span>
                                                {agent}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-zinc-700/50 flex items-center justify-between">
                                        <span className="text-xs text-zinc-500">Total Cost:</span>
                                        <span className="text-sm font-semibold text-emerald-400">
                                            {message.workflow.cost} TCRO
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    
                    <div className="mt-1 text-xs opacity-60">
                        {message.timestamp.toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-zinc-400" />
                </div>
            )}
        </div>
    )
}
