import { useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthSession } from '../hooks/useAuthSession'
import { useRoom } from '../hooks/useRoom'
import { usePlayers } from '../hooks/usePlayers'
import { usePresence } from '../hooks/usePresence'
import { rememberRoomCode } from '../lib/session'
import Lobby from '../components/Lobby.jsx'
import VotingScreen from '../components/VotingScreen.jsx'
import ResultsScreen from '../components/ResultsScreen.jsx'

export default function Room() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { authId, loading: authLoading } = useAuthSession()
  const { room, loading: roomLoading, notFound, lastError } = useRoom(code)
  const { players, loading: playersLoading } = usePlayers(room?.id)

  const me = useMemo(
    () => players.find((p) => p.auth_id === authId) ?? null,
    [players, authId]
  )

  const onlineIds = usePresence(room?.id, me?.id)

  useEffect(() => {
    if (room) rememberRoomCode(room.room_code)
  }, [room])

  const loading = authLoading || roomLoading || (room && playersLoading)

  if (loading) {
    return <CenteredMessage title="Loading room…" />
  }

  if (notFound) {
    return (
      <CenteredMessage title="Room not found" subtitle="That code doesn't match an active room.">
        {lastError && (
          <p className="mt-4 max-w-sm break-words rounded-lg bg-black/5 p-3 text-left font-mono text-xs text-ink/70">
            {lastError.code ? `[${lastError.code}] ` : ''}
            {lastError.message}
          </p>
        )}
        <Link to="/join" className="btn-primary mt-6">
          Try another code
        </Link>
      </CenteredMessage>
    )
  }

  // Landed on a room link without having joined yet.
  if (!me) {
    if (room.status === 'LOBBY') {
      navigate(`/join?code=${room.room_code}`, { replace: true })
      return null
    }
    return (
      <CenteredMessage
        title="This game already started"
        subtitle="Ask the host for a new room to join in on the next round."
      >
        <Link to="/" className="btn-primary mt-6">
          Back home
        </Link>
      </CenteredMessage>
    )
  }

  if (room.status === 'LOBBY') {
    return <Lobby room={room} players={players} me={me} onlineIds={onlineIds} />
  }

  if (room.status === 'VOTING') {
    return <VotingScreen room={room} players={players} me={me} />
  }

  return <ResultsScreen room={room} players={players} me={me} />
}

function CenteredMessage({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-2 font-medium text-ink/70">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
