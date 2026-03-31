import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      notifications: [],
      setAuth: (nextUser, nextToken) => set({ user: nextUser, token: nextToken }),
      logout: () => set({ user: null, token: null, notifications: [] })
    }),
    { name: 'scoutx_auth' }
  )
)

export default useStore

