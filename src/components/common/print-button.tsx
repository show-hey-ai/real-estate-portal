'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="h-11 rounded-[8px] bg-[#10231e] px-5 text-sm font-semibold text-white hover:bg-[#1b342d]"
    >
      <Printer className="h-4 w-4" />
      Print / Save as PDF
    </Button>
  )
}
