export default function ImposterMark({ className = '', bodyColor = '#FFFDF7', accent = '#15131C', style }) {
  return (
    <svg
      viewBox="0 0 120 130"
      className={className}
      style={style}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* hat */}
      <rect x="38" y="12" width="44" height="26" rx="10" fill={accent} stroke="#15131C" strokeWidth="5" />
      <ellipse cx="60" cy="40" rx="36" ry="9" fill={accent} stroke="#15131C" strokeWidth="5" />

      {/* head */}
      <circle cx="60" cy="76" r="44" fill={bodyColor} stroke="#15131C" strokeWidth="5" />

      {/* mask band */}
      <g transform="rotate(-3 60 76)">
        <rect x="20" y="66" width="80" height="22" rx="11" fill="#15131C" />
        <circle cx="44" cy="77" r="7" fill="#FFFDF7" />
        <circle cx="76" cy="77" r="7" fill="#FFFDF7" />
        <circle cx="45" cy="77" r="3" fill="#15131C" />
        <circle cx="77" cy="77" r="3" fill="#15131C" />
      </g>

      {/* sly grin */}
      <path d="M44 100 Q60 110 76 100" stroke="#15131C" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  )
}
