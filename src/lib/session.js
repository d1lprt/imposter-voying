// This only remembers *which room to try reconnecting to* after a refresh.
// It is not a source of truth for anything: game state always comes from
// Supabase. Losing this value just means the player has to retype a room
// code — it never causes stale or duplicated state.
const KEY = 'infiltrator.lastRoomCode'

export function rememberRoomCode(code) {
  try {
    localStorage.setItem(KEY, code)
  } catch {
    // storage unavailable (private mode etc.) - not critical
  }
}

export function getRememberedRoomCode() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function forgetRoomCode() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
