import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuthSession } from './useAuthSession'

// One-time sanity log so you can confirm in the browser console that the
// deployed site is actually pointing at the Supabase project you expect.
// Remove this once you've confirmed it's correct.
if (typeof window !== 'undefined' && !window.__loggedSupabaseUrl) {
  window.__loggedSupabaseUrl = true
  console.info('[infiltrator] Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
}

export function useRoom(roomCode) {
  const { authId, loading: authLoading } = useAuthSession()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lastError, setLastError] = useState(null)
  const attemptedOnce = useRef(false)

  const refetch = useCallback(async () => {
    if (!roomCode) return

    const normalizedCode = roomCode.trim().toUpperCase()

    const runQuery = () =>
      supabase.from('rooms').select('*').eq('room_code', normalizedCode).maybeSingle()

    let { data, error } = await runQuery()

    // One short retry: guards against any brief propagation delay right
    // after create_room() returns, rather than immediately reporting
    // "not found" on the very first attempt.
    if (!error && !data && !attemptedOnce.current) {
      attemptedOnce.current = true
      await new Promise((r) => setTimeout(r, 400))
      ;({ data, error } = await runQuery())
    }

    if (error) {
      // This is the important part: log the REAL Supabase error instead of
      // silently collapsing everything into "not found". Check this in
      // the browser console/network tab — a permission or project
      // mismatch will show up here as something like 401/403, a bad
      // API key, or a network/CORS failure, NOT a normal empty result.
      console.error('[infiltrator] room lookup failed for code', normalizedCode, error)
      setLastError(error)
      setNotFound(true)
      setRoom(null)
    } else if (!data) {
      console.warn(
        '[infiltrator] room lookup returned no row for code',
        normalizedCode,
        '- if you can see this exact code in the Supabase table editor, the ' +
          'app is querying a different Supabase project/key than the one ' +
          'that project points to, or the table editor is showing a ' +
          'different project than VITE_SUPABASE_URL above.'
      )
      setLastError(null)
      setNotFound(true)
      setRoom(null)
    } else {
      setLastError(null)
      setNotFound(false)
      setRoom(data)
    }
    setLoading(false)
  }, [roomCode])

  useEffect(() => {
    // Wait for the anonymous auth session to finish initializing before
    // querying. Not required by the current RLS policy (rooms_select is
    // public), but this avoids any request firing before the Supabase
    // client has finished its first getSession()/signInAnonymously() pass.
    if (authLoading) return
    setLoading(true)
    attemptedOnce.current = false
    refetch()
  }, [refetch, authLoading])

  // Once we know the room's id, subscribe to live updates on that one row
  // (status changes: LOBBY -> VOTING -> RESULTS).
  useEffect(() => {
    if (!room?.id) return

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload) => setRoom(payload.new)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room?.id])

  return { room, loading, notFound, lastError, refetch }
}
