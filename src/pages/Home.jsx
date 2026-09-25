import { Link } from 'react-router-dom'
import ImposterMark from '../components/ImposterMark.jsx'

export default function Home() {
  return (
    <div className="min-h-screen bg-purple">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center px-6 py-14 text-center">
        <div className="chip bg-white animate-rise">
          <span className="h-2 w-2 rounded-full bg-coral" />
          4&ndash;20 players, any device
        </div>

        <ImposterMark className="mt-8 h-40 w-40 animate-rise" style={{ animationDelay: '0.05s' }} />

        <h1
          className="mt-6 font-display text-6xl font-bold leading-[0.95] text-ink animate-rise"
          style={{ animationDelay: '0.1s' }}
        >
          Infiltrator
        </h1>

        <p className="mt-4 max-w-xs text-lg font-medium text-ink/70 animate-rise" style={{ animationDelay: '0.15s' }}>
          Find the imposters before they find you.
        </p>

        <div className="mt-10 flex w-full flex-col gap-4 animate-rise" style={{ animationDelay: '0.2s' }}>
          <Link to="/create" className="btn-primary w-full text-lg">
            Create Room
          </Link>
          <Link to="/join" className="btn-ghost w-full text-lg">
            Join Room
          </Link>
        </div>
      </div>
    </div>
  )
}
