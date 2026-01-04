"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface MobileHeaderProps {
  onMenuClick: () => void
  isMobile: boolean
}

export function MobileHeader({ onMenuClick, isMobile }: MobileHeaderProps) {
  if (!isMobile) return null

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 lg:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {

          onMenuClick()
        }}
        className="p-2"
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6" />
      </Button>

      <div className="flex-1">
        <h1 className="text-lg font-semibold text-gray-900">
          HealthChain
        </h1>
      </div>
    </header>
  )
}