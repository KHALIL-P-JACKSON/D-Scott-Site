import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../test/render'
import type { AccountSnapshot } from '../../types'
import { loadAccount } from '../../lib/account'
import { createBookingRequest } from '../../lib/bookings'
import { Booking } from './Booking'

/** A real option value, as produced by `src/data/services.ts`. */
const ACRYLIC_SHORT = 'Acrylic Full Set — Short (0–2)'

/**
 * The form only renders once the account check settles, so these specs sign in
 * as a client whose ID is already on file. The request itself is stubbed: what
 * matters here is the form behaviour, and `bookings.spec.ts` covers the insert.
 */
vi.mock('../../lib/account', async () => {
  const actual = await vi.importActual<typeof import('../../lib/account')>('../../lib/account')

  return { ...actual, loadAccount: vi.fn() }
})

vi.mock('../../lib/bookings', async () => {
  const actual = await vi.importActual<typeof import('../../lib/bookings')>('../../lib/bookings')

  return { ...actual, createBookingRequest: vi.fn() }
})

const verifiedAccount: AccountSnapshot = {
  userId: 'u-1',
  email: 'ashley@example.com',
  profile: {
    id: 'u-1',
    full_name: 'Ashley Davis',
    phone: '(555) 111-2222',
    is_admin: false,
    id_status: 'approved',
    id_path: 'u-1/id.png',
    id_uploaded_at: null,
    id_review_notes: null,
  },
}

beforeEach(() => {
  vi.mocked(loadAccount).mockReset()
  vi.mocked(createBookingRequest).mockReset()
  vi.mocked(loadAccount).mockResolvedValue({ status: 'ok', account: verifiedAccount })
  vi.mocked(createBookingRequest).mockResolvedValue({ error: null })
})

async function setup(selectedService = '') {
  const onServiceChange = vi.fn()
  const onClearSelectedService = vi.fn()

  const view = render(
    <Booking
      selectedService={selectedService}
      onServiceChange={onServiceChange}
      onClearSelectedService={onClearSelectedService}
    />,
  )

  // Wait out the account check so every test starts at the ready form.
  await screen.findByLabelText(/full name/i)

  return { ...view, onServiceChange, onClearSelectedService }
}

/**
 * Radix keeps a hidden native `<select>` in sync with its options, which is how
 * the control participates in real form submission.
 */
function chooseService(container: HTMLElement, value: string) {
  const select = Array.from(container.querySelectorAll('select')).find((candidate) =>
    Array.from(candidate.options).some((option) => option.value === value),
  )

  if (!select) {
    throw new Error(`No select offers the option "${value}"`)
  }

  fireEvent.change(select, { target: { value } })
}

/** jsdom does not run interactive form validation, so submit the form directly. */
function submitForm() {
  const button = screen.getByRole('button', { name: /request appointment/i })
  const form = button.closest('form')

  if (!form) {
    throw new Error('The submit button is not inside a form')
  }

  fireEvent.submit(form)
}

function fillContactDetails(name = 'Ashley Davis', phone = '(555) 111-2222') {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: name } })
  fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: phone } })
}

describe('Booking', () => {
  it('advertises the studio address, hours and phone number', async () => {
    await setup()

    expect(screen.getByText('Stockbridge, GA')).toBeInTheDocument()
    expect(screen.getByText('Mon - Wed: Closed')).toBeInTheDocument()
    expect(screen.getByText(/Thursday: 5:00 PM/)).toBeInTheDocument()
    expect(screen.getByText('(555) 234-5678')).toBeInTheDocument()
  })

  it('greets a signed-in client by the details on their account', async () => {
    await setup()

    expect(screen.getByLabelText(/full name/i)).toHaveValue('Ashley Davis')
    expect(screen.getByLabelText(/phone number/i)).toHaveValue('(555) 111-2222')
    expect(screen.getByLabelText(/email address/i)).toHaveValue('ashley@example.com')
  })

  it('asks a visitor to sign in before the form', async () => {
    vi.mocked(loadAccount).mockResolvedValue({ status: 'ok', account: null })
    render(
      <Booking selectedService="" onServiceChange={() => {}} onClearSelectedService={() => {}} />,
    )

    expect(await screen.findByText(/sign in to request an appointment/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument()
  })

  it('asks a signed-in client for an ID before the form', async () => {
    vi.mocked(loadAccount).mockResolvedValue({
      status: 'ok',
      account: {
        ...verifiedAccount,
        profile: verifiedAccount.profile && { ...verifiedAccount.profile, id_status: 'unverified' },
      },
    })
    render(
      <Booking selectedService="" onServiceChange={() => {}} onClearSelectedService={() => {}} />,
    )

    expect(await screen.findByText(/one step left/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument()
  })

  it('renders every field of the request form', async () => {
    await setup()

    expect(screen.getByLabelText(/full name/i)).toBeRequired()
    expect(screen.getByLabelText(/phone number/i)).toBeRequired()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preferred date/i)).toBeRequired()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /select service/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /preferred time/i })).toBeInTheDocument()
  })

  it('refuses to submit until a service is chosen', async () => {
    const { onServiceChange } = await setup()

    fillContactDetails()
    submitForm()

    expect(screen.getByText('Please select a service before submitting.')).toBeInTheDocument()
    expect(screen.queryByText(/Appointment Request Received/)).not.toBeInTheDocument()
    expect(onServiceChange).not.toHaveBeenCalled()
  })

  it('clears the warning as soon as a service is chosen', async () => {
    const { container } = await setup()

    submitForm()
    expect(screen.getByText('Please select a service before submitting.')).toBeInTheDocument()

    chooseService(container, ACRYLIC_SHORT)

    expect(screen.queryByText('Please select a service before submitting.')).not.toBeInTheDocument()
  })

  it('reports the chosen service to the parent', async () => {
    const { container, onServiceChange } = await setup()

    chooseService(container, ACRYLIC_SHORT)

    expect(onServiceChange).toHaveBeenCalledWith(ACRYLIC_SHORT)
  })

  it('shows a service that was chosen somewhere else on the page', async () => {
    await setup(ACRYLIC_SHORT)

    expect(screen.getByRole('combobox', { name: /select service/i })).toHaveTextContent(
      ACRYLIC_SHORT,
    )
  })

  it('invites the visitor to choose a service before one is selected', async () => {
    await setup()

    // The control stays controlled with an empty value, so it must not fall
    // back to its own internal state.
    expect(screen.getByRole('combobox', { name: /select service/i })).toHaveTextContent(
      /choose nail service/i,
    )
  })

  it('sends the request for a verified client and echoes the details', async () => {
    await setup(ACRYLIC_SHORT)

    fillContactDetails()
    fireEvent.change(screen.getByLabelText(/preferred date/i), {
      target: { value: '2026-05-04' },
    })
    submitForm()

    expect(await screen.findByText(/Appointment Request Received/)).toBeInTheDocument()
    expect(screen.getByText('Ashley Davis')).toBeInTheDocument()
    expect(screen.getByText('(555) 111-2222')).toBeInTheDocument()
    expect(screen.getByText(ACRYLIC_SHORT)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /request appointment/i })).not.toBeInTheDocument()
    expect(createBookingRequest).toHaveBeenCalledWith(
      verifiedAccount,
      expect.objectContaining({
        serviceOption: ACRYLIC_SHORT,
        preferredDate: '2026-05-04',
      }),
    )
  })

  it('explains a request the database refused', async () => {
    vi.mocked(createBookingRequest).mockResolvedValue({
      error: 'Add a photo ID to your account before requesting an appointment.',
    })
    await setup(ACRYLIC_SHORT)

    fillContactDetails()
    fireEvent.change(screen.getByLabelText(/preferred date/i), {
      target: { value: '2026-05-04' },
    })
    submitForm()

    expect(await screen.findByText(/add a photo id/i)).toBeInTheDocument()
    expect(screen.queryByText(/Appointment Request Received/)).not.toBeInTheDocument()
  })

  it('starts a fresh request and clears the chosen service', async () => {
    const { onClearSelectedService } = await setup(ACRYLIC_SHORT)

    fillContactDetails()
    fireEvent.change(screen.getByLabelText(/preferred date/i), {
      target: { value: '2026-05-04' },
    })
    submitForm()
    await screen.findByText(/Appointment Request Received/)
    fireEvent.click(screen.getByRole('button', { name: /submit another request/i }))

    expect(screen.getByRole('button', { name: /request appointment/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toHaveValue('')
    expect(screen.getByLabelText(/phone number/i)).toHaveValue('')
    expect(onClearSelectedService).toHaveBeenCalledTimes(1)
  })

  it('confirms the request without nesting invalid markup', async () => {
    // React logs when a `<p>` is given block-level children, which also breaks
    // hydration on a real page. Guard the success callout against regressing.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const invalidNesting =
      /cannot contain a nested|cannot be a descendant of|validateDOMNesting/i

    await setup(ACRYLIC_SHORT)
    fillContactDetails()
    fireEvent.change(screen.getByLabelText(/preferred date/i), {
      target: { value: '2026-05-04' },
    })
    submitForm()

    expect(await screen.findByText(/Appointment Request Received/)).toBeInTheDocument()
    const warnings = errorSpy.mock.calls
      .map((call) => String(call[0]))
      .filter((message) => invalidNesting.test(message))

    expect(warnings).toEqual([])
  })

  it('renders retry feedback when checking the account fails and allows retrying', async () => {
    vi.mocked(loadAccount).mockResolvedValueOnce({
      status: 'failed',
      error: 'Unable to reach database',
    })

    render(
      <Booking selectedService="" onServiceChange={() => {}} onClearSelectedService={() => {}} />,
    )

    expect(await screen.findByText(/could not check your account/i)).toBeInTheDocument()
    expect(screen.getByText(/Unable to reach database/)).toBeInTheDocument()

    const retryButton = screen.getByRole('button', { name: /try again/i })
    expect(retryButton).toBeInTheDocument()

    vi.mocked(loadAccount).mockResolvedValueOnce({
      status: 'ok',
      account: verifiedAccount,
    })

    fireEvent.click(retryButton)

    expect(await screen.findByLabelText(/full name/i)).toBeInTheDocument()
  })
})