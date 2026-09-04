import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'
import { isAuthenticated } from '../../auth/session'
import { clearNamespace } from '../../lib/storage'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => clearNamespace())

  it('shows validation errors for empty submit', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    expect(isAuthenticated()).toBe(false)
  })

  it('logs in with a valid @ohmyhotel credential', async () => {
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText(/email address/i), 'tram.tt@ohmyhotel.com')
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'anything')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => expect(isAuthenticated()).toBe(true))
  })

  it('rejects an unknown domain', async () => {
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText(/email address/i), 'nobody@gmail.com')
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'x')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))
    expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument()
    expect(isAuthenticated()).toBe(false)
  })
})
