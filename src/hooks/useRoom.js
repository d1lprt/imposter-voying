import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useRoom(roomCode) {
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const refetch = useCallback(async () => {
    if (!roomCode) return
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .maybeSingle()

    if (error || !data) {
      setNotFound(true)
      setRoom(null)
    } else {
      setNotFound(false)
      setRoom(data)
    }
    setLoading(false)
  }, [roomCode])

  useEffect(() => {
    setLoading(true)
    refetch()
  }, [refetch])

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

  return { room, loading, notFound, refetch }
}
