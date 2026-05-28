'use client'

import { create } from 'zustand'

interface ScanState {
  lastScan: any | null
  setLastScan: (scan: any) => void
  clearLastScan: () => void
}

export const useScanStore = create<ScanState>((set) => ({
  lastScan: null,
  setLastScan: (scan) => set({ lastScan: scan }),
  clearLastScan: () => set({ lastScan: null }),
}))
