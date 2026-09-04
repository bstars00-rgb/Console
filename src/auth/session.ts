/**
 * Mock authentication. NO real auth server is contacted. A demo credential is
 * checked locally; on success a fake session is persisted so route guards and
 * refresh-persistence behave like the real console. Credentials are never sent
 * anywhere and never stored beyond the boolean session below.
 */
import { readJSON, writeJSON, removeKey } from '../lib/storage'

export type LangCode = 'AUTO' | 'EN' | 'KO' | 'ZH' | 'JA' | 'VI'

export interface Session {
  email: string
  name: string
  hotelName: string
  loggedInAt: string
}

const SESSION_KEY = 'session'

/** Demo credential — documented in README. Purely local, not a real account. */
export const DEMO_EMAIL = 'demo@ohmyhotel.biz'
export const DEMO_PASSWORD = 'demo1234'

export function getSession(): Session | null {
  return readJSON<Session | null>(SESSION_KEY, null)
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}

export interface LoginResult {
  ok: boolean
  error?: string
}

export function login(email: string, password: string): LoginResult {
  const e = email.trim().toLowerCase()
  // Accept the documented demo credential, or any @ohmyhotel address in the
  // demo (so the prototype is easy to explore) — this is a mock, not real auth.
  const okDemo = e === DEMO_EMAIL && password === DEMO_PASSWORD
  const okLoose = e.endsWith('@ohmyhotel.biz') || e.endsWith('@ohmyhotel.com')
  if (!okDemo && !okLoose) {
    return { ok: false, error: 'Incorrect email or password.' }
  }
  const session: Session = {
    email: e,
    name: 'Vendor Admin',
    hotelName: 'Ohmy Grand Hotel Seoul',
    loggedInAt: new Date().toISOString(),
  }
  writeJSON(SESSION_KEY, session)
  return { ok: true }
}

export function logout(): void {
  removeKey(SESSION_KEY)
}
