import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useVotes } from '../hooks/useVotes'
import { forgetRoomCode } from '../lib/session'
import WhoVotedForWhom from './WhoVotedForWhom.jsx'

export default function ResultsScreen({ room, players, me }) {
  const navigate = useNavigate()
  const { votes, loading } = useVotes(room.id, room.status === 'RESULTS')
  const [revealed, setRevealed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 80)
    return () => clearTimeout(t)
  }, [])

  const ranked = useMemo(() => {
    const counts = new Map(players.map((p) => [p.id, 0]))
    for (const v of votes) counts.set(v.target_id, (counts.get(v.target_id) ?? 0) + 1)
    return players
      .map((player) => ({ player, count: counts.get(player.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
  }, [players, votes])

  const maxCount = ranked[0]?.count ?? 0
  const leaders = ranked.filter((r) => r.count === maxCount && maxCount > 0)
  const isTie = leaders.length > 1

  async function handlePlayAgain() {
    setBusy(true)
    setError(null)
    const { error: rpcError } = await supabase.rpc('play_again', { p_room_id: room.id })
    if (rpcError) {
      setError('Could not start a new round.')
      setBusy(false)
    }
  }

  async function handleTiebreaker() {
    setBusy(true)
    setError(null)
    const { error: rpcError } = await supabase.rpc('restart_voting', { p_room_id: room.id })
    if (rpcError) {
      setError('Could not start the tiebreaker.')
      setBusy(false)
    }
  }

  function handleNewRoom() {
    forgetRoomCode()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gold">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
          <p className="font-display font-semibold text-ink">Tallying votes…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gold pb-6">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <div className="animate-rise text-center">
          <p className="chip mx-auto bg-white">Results are in</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-ink">
            {isTie ? "It's a tie" : `${leaders[0]?.player.name} takes the most votes`}
          </h1>
        </div>

        {isTie && (
          <div className="card mt-4 border-coral bg-coral-soft px-4 py-3 text-center animate-popIn">
            <p className="font-display font-bold text-coral-deep">Tie</p>
            <p className="mt-1 text-sm font-medium text-ink/70">
              {leaders.map((l) => l.player.name).join(' & ')} — {maxCount} votes each
            </p>
          </div>
        )}

        <div className="card mt-6 flex flex-col gap-4 p-5">
          {ranked.map((r, i) => {
            const pct = maxCount > 0 ? Math.round((r.count / maxCount) * 100) : 0
            return (
              <div key={r.player.id} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="font-display font-semibold text-ink">{r.player.name}</span>
                  <span className="font-mono text-sm font-semibold text-ink/60">
                    {r.count} {r.count === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full border-[2.5px] border-ink bg-cream">
                  <div
                    className="h-full rounded-full bg-coral transition-all duration-700 ease-out"
                    style={{ width: revealed ? `${Math.max(pct, r.count > 0 ? 6 : 0)}%` : '0%' }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <WhoVotedForWhom ranked={ranked} votes={votes} players={players} />

        <div className="mt-8 flex flex-col gap-3">
          {error && <p className="text-center text-sm font-semibold text-coral-deep">{error}</p>}

          {me.is_host ? (
            isTie ? (
              <button onClick={handleTiebreaker} disabled={busy} className="btn-accent w-full text-lg">
                {busy ? 'Starting…' : 'Start Tiebreaker'}
              </button>
            ) : (
              <button onClick={handlePlayAgain} disabled={busy} className="btn-primary w-full text-lg">
                {busy ? 'Starting…' : 'Play Again'}
              </button>
            )
          ) : (
            <p className="text-center text-sm font-medium text-ink/70">Waiting for the host to start the next round…</p>
          )}

          <button onClick={handleNewRoom} className="btn-ghost w-full text-sm">
            New Room
          </button>
        </div>
      </div>
    </div>
  )
}
