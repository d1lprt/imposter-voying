const AVATAR_COLORS = ['bg-purple-soft', 'bg-coral-soft', 'bg-gold-soft', 'bg-mint-soft', 'bg-peach-soft']

function colorFor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

export default function PlayerCard({ name, isHost, isMe, online, trailing, dim }) {
  return (
    <div
      className={`card-sm flex items-center justify-between gap-3 px-3 py-2.5 transition-opacity ${
        dim ? 'opacity-50' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <div
            className={`grid h-10 w-10 place-items-center rounded-full border-[2.5px] border-ink font-display font-bold text-ink ${colorFor(
              name
            )}`}
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
          {isHost && (
            <span className="absolute -right-1.5 -top-1.5 text-base leading-none" aria-hidden="true">
              👑
            </span>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-paper ${
              online ? 'bg-mint-deep' : 'bg-ink/20'
            }`}
          />
        </div>
        <span className="truncate font-display font-semibold text-ink">
          {name}
          {isMe && <span className="ml-1.5 text-xs font-medium text-ink/50">(you)</span>}
        </span>
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
}
