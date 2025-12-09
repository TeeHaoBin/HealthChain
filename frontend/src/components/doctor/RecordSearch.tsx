"use client"

import { useState } from "react"
import { Search, Wallet } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface RecordSearchProps {
    onSearch: (walletAddress: string) => void
    loading?: boolean
}

export default function RecordSearch({ onSearch, loading }: RecordSearchProps) {
    const [walletAddress, setWalletAddress] = useState("")

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (walletAddress.trim()) {
            onSearch(walletAddress.trim())
        }
    }

    const isValidWallet = /^0x[a-fA-F0-9]{40}$/.test(walletAddress)

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Search by Patient Wallet</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
                Enter the patient&apos;s wallet address to view their health records and request access.
            </p>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        type="text"
                        placeholder="Enter patient wallet address (0x...)"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="pl-10 w-full font-mono"
                        aria-label="Patient wallet address"
                    />
                </div>

                <Button
                    type="submit"
                    className="md:w-auto"
                    disabled={!walletAddress.trim() || loading}
                >
                    {loading ? "Searching..." : "Search Records"}
                </Button>
            </form>
            {walletAddress && !isValidWallet && walletAddress.length > 2 && (
                <p className="text-sm text-amber-600 mt-2">
                    Wallet address should be 42 characters starting with 0x
                </p>
            )}
        </div>
    )
}
