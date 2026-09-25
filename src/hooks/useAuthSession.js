import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Ensures the browser has a Supabase anonymous auth session and returns the
 * stable auth user id for it. This id (auth.uid()) is what ties a browser to
 * a `players` row and is what every RLS policy and RPC function checks
 * against — it's the real player identity, not something we invent client-side.
 *
 * Supabase persists this session itself (it's an auth token, not game state),
 * so refreshing the page reuses the same identity instead of creating a new
 * player.
 */
export function useAuthSession() {
  const [authId, setAuthId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function ensureSession() {
      try {
        const { data: existing } = await supabase.auth.getSession()
        let session = existing?.session

        if (!session) {
          const { data, error: signInError } = await supabase.auth.signInAnonymously()
          if (signInError) throw signInError
          session = data.session
        }

        if (mounted) {
          setAuthId(session?.user?.id ?? null)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err)
          setLoading(false)
        }
      }
    }

    ensureSession()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setAuthId(session?.user?.id ?? null)
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  return { authId, loading, error }
}
