import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { forgetRoomCode } from '../lib/session'
import PlayerCard from './PlayerCard.jsx'

export default function Lobby({ room, players, me, onlineIds }) {
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const full = players.length >= room.max_players

  async function handleStart() {
    setStarting(true)
    setError(null)
    const { error: rpcError } = await supabase.rpc('start_voting', { p_room_id: room.id })
    if (rpcError) {
      setError('Could not start voting yet.')
      setStarting(false)
    }
  }

  async function handleLeave() {
    setLeaving(true)
    await supabase.rpc('leave_room', { p_room_id: room.id })
    forgetRoomCode()
    navigate('/')
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(room.room_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  return (
    <div className="min-h-screen bg-purple">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <div className="card flex items-center justify-between p-5 animate-rise">
          <div>
            <p className="text-sm font-semibold text-ink/60">Room code</p>
            <h1 className="font-display text-4xl font-bold tracking-wider text-ink">{room.room_code}</h1>
          </div>
          <button onClick={handleCopy} className="chip bg-cream shrink-0">
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="font-display text-lg font-bold text-ink">Players</p>
          <span className="chip bg-white">
            {players.length} / {room.max_players}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2.5">
          {players.map((p) => (
            <PlayerCard
              key={p.id}
              name={p.name}
              isHost={p.is_host}
              isMe={p.id === me.id}
              online={onlineIds.has(p.id)}
            />
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-10">
          {error && <p className="text-center text-sm font-semibold text-white">{error}</p>}

          {me.is_host ? (
            <>
              <button
                onClick={handleStart}
                disabled={!full || starting}
                className="btn-primary w-full text-lg"
              >
                {starting
                  ? 'Starting…'
                  : full
                  ? 'Start Voting'
                  : `Waiting for ${room.max_players - players.length} more…`}
              </button>
              {!full && (
                <p className="text-center text-sm font-medium text-ink/70">
                  Voting unlocks once all {room.max_players} seats are filled.
                </p>
              )}
            </>
          ) : (
            <p className="text-center text-sm font-medium text-ink/70">Waiting for the host to start voting…</p>
          )}

          <button onClick={handleLeave} disabled={leaving} className="btn-ghost w-full text-sm">
            {leaving ? 'Leaving…' : 'Leave room'}
          </button>
        </div>
      </div>
    </div>
  )
}
