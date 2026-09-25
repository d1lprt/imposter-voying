export default function ConfirmVotesModal({ summary, onCancel, onConfirm, submitting, error }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 px-4 pb-4 sm:items-center sm:pb-0">
      <div className="card w-full max-w-sm bg-paper p-6 animate-popIn">
        <h2 className="font-display text-xl font-bold text-ink">Confirm your votes?</h2>
        <p className="mt-1 text-sm font-medium text-ink/70">
          Once submitted, your votes lock in and can't be changed.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {summary.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-2xl border-[2.5px] border-ink bg-cream px-4 py-2.5">
              <span className="font-display font-semibold text-ink">{s.name}</span>
              <span className="chip bg-coral text-ink">
                {s.count} {s.count === 1 ? 'vote' : 'votes'}
              </span>
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-coral-deep">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} disabled={submitting} className="btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Locking in…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
