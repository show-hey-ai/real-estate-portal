'use client'

import { createContext, useContext } from 'react'
import type { JpyRates } from '@/lib/fx'

const FxRatesContext = createContext<JpyRates | null>(null)

/** Shares the day's JPY rates (fetched once per request on the server) with listing cards. */
export function FxRatesProvider({ rates, children }: { rates: JpyRates | null; children: React.ReactNode }) {
  return <FxRatesContext.Provider value={rates}>{children}</FxRatesContext.Provider>
}

export function useFxRates(): JpyRates | null {
  return useContext(FxRatesContext)
}
