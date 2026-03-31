import { useAuth as useAuthCtx } from '../context/AuthContext.jsx'

export default function useAuth() {
  return useAuthCtx()
}

