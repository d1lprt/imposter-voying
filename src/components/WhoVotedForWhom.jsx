import { useState } from 'react'

export default function WhoVotedForWhom({ ranked, votes, players }) {
  const [openId, setOpenId] = useState(null)

  const nameOf = (id) => players.find((p) => p.id === id)?.name ?? 'Unknown'

  const votersFor = (targetId) =>
    votes.filter((v) => v.target_id === targetId).map((v) => nameOf(v.voter_id))

  const table = players
    .map((voter) => {
      const mine = votes
        .filter((v) => v.voter_id === voter.id)
        .sort((a, b) => a.vote_number - b.vote_number)
      return { voter, vote1: mine[0], vote2: mine[1] }
    })
    .filter((row) => row.vote1 || row.vote2)

  return (
    <div className="mt-8">
      <h2 className="font-display text-xl font-bold text-ink">Who voted for whom</h2>

      <div className="mt-3 flex flex-col gap-2.5">
        {ranked
          .filter((r) => r.count > 0)
          .map((r) => (
            <div key={r.player.id} className="card-sm overflow-hidden">
              <button
                onClick={() => setOpenId(openId === r.player.id ? null : r.player.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-display font-semibold text-ink">
                  {r.player.name} <span className="font-medium text-ink/50">received {r.count}</span>
                </span>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-[2px] border-ink font-bold text-ink">
                  {openId === r.player.id ? '−' : '+'}
                </span>
              </button>
              {openId === r.player.id && (
                <div className="border-t-[2.5px] border-ink bg-cream px-4 py-3 animate-rise">
                  {votersFor(r.player.id).map((voterName, i) => (
                    <p key={i} className="text-sm font-medium text-ink/70">
                      {voterName} → <span className="font-semibold text-ink">{r.player.name}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>

      <div className="card-sm mt-5 overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <thead>
            <tr className="border-b-[2.5px] border-ink bg-cream text-left">
              <th className="px-3 py-2 font-display font-semibold text-ink">Voter</th>
              <th className="px-3 py-2 font-display font-semibold text-ink">Vote 1</th>
              <th className="px-3 py-2 font-display font-semibold text-ink">Vote 2</th>
            </tr>
          </thead>
          <tbody>
            {table.map(({ voter, vote1, vote2 }) => (
              <tr key={voter.id} className="border-t border-ink/15">
                <td className="px-3 py-2 font-semibold text-ink">{voter.name}</td>
                <td className="px-3 py-2 font-medium text-ink/70">{vote1 ? nameOf(vote1.target_id) : '—'}</td>
                <td className="px-3 py-2 font-medium text-ink/70">{vote2 ? nameOf(vote2.target_id) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
