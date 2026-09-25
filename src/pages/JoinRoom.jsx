import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuthSession } from '../hooks/useAuthSession'
import { rememberRoomCode } from '../lib/session'

const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: "That room code doesn't exist. Double-check it with the host.",
  GAME_STARTED: 'This game has already started, so new players can\u2019t join.',
  ROOM_FULL: 'This room is full.',
  NAME_TAKEN: 'Someone in the room is already using that name — try another.',
}

function readableError(rpcError) {
  const key = Object.keys(ERROR_MESSAGES).find((k) => rpcError?.message?.includes(k))
  return key ? ERROR_MESSAGES[key] : 'Could not join the room. Please try again.'
}

export default function JoinRoom() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { authId, loading: authLoading } = useAuthSession()
  const [code, setCode] = useState(params.get('code')?.toUpperCase() ?? '')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!code.trim() || !name.trim() || !authId) return
    setSubmitting(true)
    setError(null)

    const { error: rpcError } = await supabase
      .rpc('join_room', { p_room_code: code.trim().toUpperCase(), p_name: name.trim() })
      .single()

    if (rpcError) {
      setError(readableError(rpcError))
      setSubmitting(false)
      return
    }

    rememberRoomCode(code.trim().toUpperCase())
    navigate(`/room/${code.trim().toUpperCase()}`)
  }

  return (
    <div className="min-h-screen bg-peach">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-14">
        <Link to="/" className="mb-8 w-fit chip bg-white text-sm">
          &larr; Back
        </Link>

        <h1 className="font-display text-4xl font-bold text-ink">Join a room</h1>
        <p className="mt-2 font-medium text-ink/70">Ask the host for the room code.</p>

        <form onSubmit={handleSubmit} className="card mt-8 flex flex-col gap-6 p-6">
          <div>
            <label htmlFor="code" className="mb-2 block text-sm font-semibold text-ink/70">
              Room code
            </label>
            <input
              id="code"
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="X7K9P"
              className="field text-center font-mono text-2xl uppercase tracking-[0.3em]"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-ink/70">
              Your name
            </label>
            <input
              id="name"
              type="text"
              required
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="field"
            />
          </div>

          {error && <p className="text-sm font-semibold text-coral-deep">{error}</p>}

          <button
            type="submit"
            disabled={submitting || authLoading || !code.trim() || !name.trim()}
            className="btn-primary w-full text-lg"
          >
            {submitting ? 'Joining…' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  )
}
