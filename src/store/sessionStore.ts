import { create } from 'zustand'

interface SessionState {
  isOnline: boolean
  lastSyncAt: string | null
  deviceInfo: string
  setOnline: (isOnline: boolean) => void
  setLastSyncAt: (value: string) => void
  hydrateDeviceInfo: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  isOnline: navigator.onLine,
  lastSyncAt: null,
  deviceInfo: 'Unknown device',
  setOnline: (isOnline) => set({ isOnline }),
  setLastSyncAt: (value) => set({ lastSyncAt: value }),
  hydrateDeviceInfo: () => {
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    set({ deviceInfo: `${platform} • ${userAgent}` })
  },
}))
