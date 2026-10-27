import { describe, expect, it } from 'vitest'
import { render, screen, userEvent, within } from '../../test/render'
import { Navbar } from './Navbar'

describe('collapsed navigation', () => {
  it('opens a menu with account sign-in and every navigation destination', async () => {
    const user = userEvent.setup()
    render(<Navbar />)

    const trigger = screen.getByRole('button', { name: 'Open navigation menu' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const menu = within(screen.getByRole('menu'))
    const destinations = [
      ['Services', '#services'],
      ['Why Us', '#why-us'],
      ['Reviews', '#reviews'],
      ['Hours & Location', '#hours'],
      ['Account / Sign In', '#/account'],
      ['Book Appointment', '#booking'],
      ['Call (555) 234-5678', 'tel:5552345678'],
    ]

    for (const [name, href] of destinations) {
      expect(menu.getByRole('menuitem', { name })).toHaveAttribute('href', href)
    }

    await user.click(menu.getByRole('menuitem', { name: 'Account / Sign In' }))

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('supports keyboard opening, dismissal, and focus returning to the trigger', async () => {
    const user = userEvent.setup()
    render(<Navbar />)

    const trigger = screen.getByRole('button', { name: 'Open navigation menu' })
    trigger.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Services' })).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
