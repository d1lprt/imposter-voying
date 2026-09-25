import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function usePlayers(roomId) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!roomId) return
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true })
    setPlayers(data ?? [])
    setLoading(false)
  }, [roomId])

  useEffect(() => {
    setLoading(true)
    refetch()
  }, [refetch])

  useEffect(() => {
    if (!roomId) return

    // Joins, leaves, and has_voted flips all land here in real time.
    const channel = supabase
      .channel(`players-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        () => refetch()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, refetch])

  return { players, loading, refetch }
}
