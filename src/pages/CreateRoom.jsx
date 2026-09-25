import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuthSession } from '../hooks/useAuthSession'
import { rememberRoomCode } from '../lib/session'

export default function CreateRoom() {
  const navigate = useNavigate()
  const { authId, loading: authLoading } = useAuthSession()
  const [name, setName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(8)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !authId) return
    setSubmitting(true)
    setError(null)

    const { data, error: rpcError } = await supabase
      .rpc('create_room', { p_max_players: maxPlayers, p_host_name: name.trim() })
      .single()

    if (rpcError) {
      setError('Could not create the room. Please try again.')
      setSubmitting(false)
      return
    }

    rememberRoomCode(data.room_code)
    navigate(`/room/${data.room_code}`)
  }

  return (
    <div className="min-h-screen bg-mint">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-14">
        <Link to="/" className="mb-8 w-fit chip bg-white text-sm">
          &larr; Back
        </Link>

        <h1 className="font-display text-4xl font-bold text-ink">Create a room</h1>
        <p className="mt-2 font-medium text-ink/70">You'll be the host and can start the vote when everyone's in.</p>

        <form onSubmit={handleSubmit} className="card mt-8 flex flex-col gap-6 p-6">
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
              autoFocus
            />
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label htmlFor="maxPlayers" className="text-sm font-semibold text-ink/70">
                Number of players
              </label>
              <span className="font-display text-xl font-bold text-purple">{maxPlayers}</span>
            </div>
            <input
              id="maxPlayers"
              type="range"
              min={4}
              max={20}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full accent-purple"
            />
            <div className="mt-1 flex justify-between text-xs font-medium text-ink/50">
              <span>4</span>
              <span>20</span>
            </div>
          </div>

          {error && <p className="text-sm font-semibold text-coral-deep">{error}</p>}

          <button
            type="submit"
            disabled={submitting || authLoading || !name.trim()}
            className="btn-primary w-full text-lg"
          >
            {submitting ? 'Creating room…' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  )
}
