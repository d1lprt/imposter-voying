import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Tracks which player ids currently have a live connection to this room.
 * This is purely cosmetic (an "online" dot) — it never removes anyone from
 * the roster. Actual leaving is a deliberate action via leave_room().
 */
export function usePresence(roomId, myPlayerId) {
  const [onlineIds, setOnlineIds] = useState(new Set())

  useEffect(() => {
    if (!roomId || !myPlayerId) return

    const channel = supabase.channel(`presence-${roomId}`, {
      config: { presence: { key: myPlayerId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineIds(new Set(Object.keys(channel.presenceState())))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, myPlayerId])

  return onlineIds
}
