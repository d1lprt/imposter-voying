import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useVotes(roomId, enabled) {
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!roomId || !enabled) return
    const { data } = await supabase.from('votes').select('*').eq('room_id', roomId)
    setVotes(data ?? [])
    setLoading(false)
  }, [roomId, enabled])

  useEffect(() => {
    if (!enabled) {
      setVotes([])
      return
    }
    setLoading(true)
    refetch()
  }, [enabled, refetch])

  useEffect(() => {
    if (!roomId || !enabled) return

    const channel = supabase
      .channel(`votes-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        () => refetch()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, enabled, refetch])

  return { votes, loading }
}
