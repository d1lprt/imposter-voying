export default function VotingProgress({ players }) {
  const votedCount = players.filter((p) => p.has_voted).length

  return (
    <div className="card-sm px-4 py-4">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-sm font-bold text-ink">Voting progress</p>
        <p className="font-mono text-sm font-semibold text-coral-deep">
          {votedCount} / {players.length}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {players.map((p) => (
          <span key={p.id} className="flex items-center gap-1.5 text-sm font-medium text-ink/70">
            <span aria-hidden="true">{p.has_voted ? '✓' : '⏳'}</span>
            {p.name}
          </span>
        ))}
      </div>
    </div>
  )
}
