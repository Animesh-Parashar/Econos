'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import { formatEther } from 'viem'

interface PaymentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    amount: string
    currency: string
    recipient: string
    chainId: number
    onPayment: () => Promise<void>
    isConnected: boolean
    onConnect: () => void
    isPending: boolean
    isConfirming: boolean
    isSuccess: boolean
    error: Error | null
    txHash?: string
}

export function PaymentModal({
    open,
    onOpenChange,
    amount,
    currency,
    recipient,
    chainId,
    onPayment,
    isConnected,
    onConnect,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash,
}: PaymentModalProps) {
    const chainName = chainId === 338 ? 'Cronos Testnet' : chainId === 240 ? 'Cronos zkEVM Testnet' : `Chain ${chainId}`
    const explorerUrl = chainId === 338
        ? 'https://explorer.cronos.org/testnet'
        : 'https://explorer.zkevm.cronos.org/testnet'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white">
                        {isSuccess ? 'Payment Confirmed' : 'Payment Required'}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {isSuccess
                            ? 'Your pipeline is now executing'
                            : 'Complete this payment to execute your workflow'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Payment Details */}
                    {!isSuccess && (
                        <div className="space-y-3 rounded-lg bg-zinc-800/50 p-4 border border-zinc-700">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-400">Amount</span>
                                <span className="text-lg font-semibold text-green-400">
                                    {amount} {currency}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-400">Network</span>
                                <span className="text-sm text-white">{chainName}</span>
                            </div>
                            <div className="flex justify-between items-start gap-2">
                                <span className="text-sm text-zinc-400">Recipient</span>
                                <span className="text-xs text-zinc-300 font-mono break-all text-right">
                                    {recipient}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Status Messages */}
                    {isPending && (
                        <div className="flex items-center gap-3 text-sm text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Waiting for wallet approval...</span>
                        </div>
                    )}

                    {isConfirming && (
                        <div className="flex items-center gap-3 text-sm text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-lg p-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Confirming transaction on blockchain...</span>
                        </div>
                    )}

                    {isSuccess && txHash && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg p-3">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Payment confirmed! Executing pipeline...</span>
                            </div>
                            <a
                                href={`${explorerUrl}/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <span>View transaction</span>
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-start gap-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium">Payment Failed</p>
                                <p className="text-xs text-red-300 mt-1">
                                    {error.message || 'An error occurred during payment'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* L402 Protocol Info */}
                    {!isSuccess && !error && (
                        <div className="text-xs text-zinc-500 space-y-1">
                            <p className="flex items-center gap-1">
                                <span className="font-mono bg-zinc-800 px-1 rounded">L402</span>
                                <span>Payment Protocol</span>
                            </p>
                            <p>Your transaction will be verified on-chain before execution</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {!isConnected ? (
                        <Button
                            onClick={onConnect}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Connect Wallet
                        </Button>
                    ) : isSuccess ? (
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                        >
                            Close
                        </Button>
                    ) : (
                        <div className="flex gap-2 w-full">
                            <Button
                                onClick={() => onOpenChange(false)}
                                variant="outline"
                                disabled={isPending || isConfirming}
                                className="flex-1 border-zinc-700 hover:bg-zinc-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={onPayment}
                                disabled={isPending || isConfirming}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isPending || isConfirming ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Pay ${amount} ${currency}`
                                )}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
