"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"

import {
  getAuthenticatedUser,
  signOutCurrentUser,
  type AuthenticatedUser,
} from "@/lib/auth"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

type AuthContextValue = {
  status: AuthStatus
  user: AuthenticatedUser | null
  refreshSession: (options?: { showLoading?: boolean }) => Promise<AuthenticatedUser | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const requestRef = useRef(0)
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [user, setUser] = useState<AuthenticatedUser | null>(null)

  async function refreshSession(options?: { showLoading?: boolean }) {
    const requestId = requestRef.current + 1
    requestRef.current = requestId

    if (options?.showLoading ?? true) {
      setStatus("loading")
    }

    try {
      const nextUser = await getAuthenticatedUser()

      if (requestRef.current !== requestId) {
        return nextUser
      }

      setUser(nextUser)
      setStatus(nextUser ? "authenticated" : "unauthenticated")
      return nextUser
    } catch (error) {
      console.error("Unable to sync the current auth session.", error)

      if (requestRef.current === requestId) {
        setUser(null)
        setStatus("unauthenticated")
      }

      return null
    }
  }

  async function handleSignOut() {
    requestRef.current += 1

    try {
      await signOutCurrentUser()
    } finally {
      setUser(null)
      setStatus("unauthenticated")
    }
  }

  useEffect(() => {
    void refreshSession()
  }, [pathname])

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        refreshSession,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.")
  }

  return context
}
