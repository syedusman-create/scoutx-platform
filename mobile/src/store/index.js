import { create } from 'zustand'

const useMobileStore = create((set) => ({
  token: null,
  user: null,

  setAuth: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null })
}))

export default useMobileStore

