'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface TaskInputDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (taskDescription: string) => void
    agentCount: number
}

export function TaskInputDialog({ open, onOpenChange, onSubmit, agentCount }: TaskInputDialogProps) {
    const [taskDescription, setTaskDescription] = useState('')

    const handleSubmit = () => {
        if (taskDescription.trim()) {
            onSubmit(taskDescription.trim())
            setTaskDescription('')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100">What should these agents do?</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        You've selected {agentCount} agent{agentCount !== 1 ? 's' : ''} for your workflow. 
                        Describe the task you want them to execute.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Textarea
                        placeholder="E.g., Research the latest trends in AI and create a summary report with visualizations..."
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        className="min-h-[120px] bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                        autoFocus
                    />
                    
                    <p className="text-xs text-zinc-500">
                        Be specific about what you want the agents to do. The more detail you provide, 
                        the better the results.
                    </p>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!taskDescription.trim()}
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                        Continue to Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
