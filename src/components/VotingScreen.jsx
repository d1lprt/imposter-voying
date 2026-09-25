import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import PlayerCard from './PlayerCard.jsx'
import VotingProgress from './VotingProgress.jsx'
import ConfirmVotesModal from './ConfirmVotesModal.jsx'

export default function VotingScreen({ room, players, me }) {
  const [selections, setSelections] = useState([]) // array of player ids, len <= 2
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const votable = useMemo(() => players.filter((p) => p.id !== me.id), [players, me.id])

  function countFor(playerId) {
    return selections.filter((id) => id === playerId).length
  }

  function addVote(playerId) {
    if (selections.length >= 2) return
    setSelections((s) => [...s, playerId])
  }

  function removeVote(playerId) {
    setSelections((s) => {
      const idx = s.indexOf(playerId)
      if (idx === -1) return s
      const copy = [...s]
      copy.splice(idx, 1)
      return copy
    })
  }

  const summary = useMemo(() => {
    const byId = new Map()
    for (const id of selections) {
      const player = players.find((p) => p.id === id)
      if (!player) continue
      byId.set(id, { id, name: player.name, count: (byId.get(id)?.count ?? 0) + 1 })
    }
    return [...byId.values()]
  }, [selections, players])

  async function handleConfirm() {
    setSubmitting(true)
    setSubmitError(null)
    const { error } = await supabase.rpc('submit_votes', {
      p_room_id: room.id,
      p_targets: selections,
    })
    if (error) {
      setSubmitError('Something went wrong submitting your votes. Please try again.')
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    setConfirmOpen(false)
  }

  if (me.has_voted) {
    return (
      <div className="min-h-screen bg-coral">
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
          <div className="card flex flex-col items-center p-8 text-center animate-popIn">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border-[3px] border-ink bg-mint text-2xl">
              ✓
            </div>
            <h1 className="font-display text-2xl font-bold text-ink">Votes submitted</h1>
            <p className="mt-1 font-medium text-ink/70">Sit tight while the rest of the room finishes up.</p>
          </div>
          <div className="mt-6">
            <VotingProgress players={players} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-coral pb-6">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <div className="animate-rise">
          <h1 className="font-display text-3xl font-bold text-ink">Who's the infiltrator?</h1>
          <p className="mt-2 font-medium text-ink/70">You have 2 votes. Split them or stack them on one person.</p>
        </div>

        <div className="sticky top-4 z-10 mt-5 flex justify-center">
          <div className="chip bg-ink px-5 py-2 text-paper">
            Your votes <span className="font-mono font-bold">{selections.length} / 2</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          {votable.map((p) => {
            const count = countFor(p.id)
            return (
              <PlayerCard
                key={p.id}
                name={p.name}
                isHost={p.is_host}
                online
                trailing={
                  <div className="flex items-center gap-2">
                    {count > 0 && (
                      <>
                        <span className="font-display text-sm font-bold text-coral-deep">×{count}</span>
                        <button
                          onClick={() => removeVote(p.id)}
                          className="grid h-8 w-8 place-items-center rounded-full border-[2.5px] border-ink bg-paper font-bold text-ink"
                          aria-label={`Remove one vote from ${p.name}`}
                        >
                          −
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => addVote(p.id)}
                      disabled={selections.length >= 2}
                      className="rounded-full border-[2.5px] border-ink bg-ink px-3 py-1.5 text-sm font-bold text-paper disabled:opacity-30"
                    >
                      + Vote
                    </button>
                  </div>
                }
              />
            )
          })}
        </div>

        <div className="mt-6">
          <VotingProgress players={players} />
        </div>

        <div className="mt-6">
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={selections.length !== 2}
            className="btn-primary w-full text-lg"
          >
            {selections.length === 2 ? 'Confirm Votes' : `Select ${2 - selections.length} more`}
          </button>
        </div>

        {confirmOpen && (
          <ConfirmVotesModal
            summary={summary}
            submitting={submitting}
            error={submitError}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </div>
  )
}
