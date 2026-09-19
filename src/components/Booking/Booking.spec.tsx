import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../test/render'
import { Booking } from './Booking'

/** A real option value, as produced by `src/data/services.ts`. */
const ACRYLIC_SHORT = 'Acrylic Full Set — Short (0–2)'

function setup(selectedService = '') {
  const onServiceChange = vi.fn()
  const onClearSelectedService = vi.fn()

  const view = render(
    <Booking
      selectedService={selectedService}
      onServiceChange={onServiceChange}
      onClearSelectedService={onClearSelectedService}
    />,
  )

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
  it('advertises the studio address, hours and phone number', () => {
    setup()

    expect(screen.getByText('124 Main Street, Suite 200, Downtown')).toBeInTheDocument()
    expect(screen.getByText(/Mon - Fri/)).toBeInTheDocument()
    expect(screen.getByText('(555) 234-5678')).toBeInTheDocument()
  })

  it('renders every field of the request form', () => {
    setup()

    expect(screen.getByLabelText(/full name/i)).toBeRequired()
    expect(screen.getByLabelText(/phone number/i)).toBeRequired()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preferred date/i)).toBeRequired()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /select service/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /preferred time/i })).toBeInTheDocument()
  })

  it('refuses to submit until a service is chosen', () => {
    const { onServiceChange } = setup()

    fillContactDetails()
    submitForm()

    expect(screen.getByText('Please select a service before submitting.')).toBeInTheDocument()
    expect(screen.queryByText(/Appointment Request Received/)).not.toBeInTheDocument()
    expect(onServiceChange).not.toHaveBeenCalled()
  })

  it('clears the warning as soon as a service is chosen', () => {
    const { container } = setup()

    submitForm()
    expect(screen.getByText('Please select a service before submitting.')).toBeInTheDocument()

    chooseService(container, ACRYLIC_SHORT)

    expect(screen.queryByText('Please select a service before submitting.')).not.toBeInTheDocument()
  })

  it('reports the chosen service to the parent', () => {
    const { container, onServiceChange } = setup()

    chooseService(container, ACRYLIC_SHORT)

    expect(onServiceChange).toHaveBeenCalledWith(ACRYLIC_SHORT)
  })

  it('shows a service that was chosen somewhere else on the page', () => {
    setup(ACRYLIC_SHORT)

    expect(screen.getByRole('combobox', { name: /select service/i })).toHaveTextContent(
      ACRYLIC_SHORT,
    )
  })

  it('invites the visitor to choose a service before one is selected', () => {
    setup()

    // The control stays controlled with an empty value, so it must not fall
    // back to its own internal state.
    expect(screen.getByRole('combobox', { name: /select service/i })).toHaveTextContent(
      /choose nail service/i,
    )
  })

  it('confirms the request and echoes the client details', () => {
    setup(ACRYLIC_SHORT)

    fillContactDetails()
    submitForm()

    expect(screen.getByText(/Appointment Request Received/)).toBeInTheDocument()
    expect(screen.getByText('Ashley Davis')).toBeInTheDocument()
    expect(screen.getByText('(555) 111-2222')).toBeInTheDocument()
    expect(screen.getByText(ACRYLIC_SHORT)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /request appointment/i })).not.toBeInTheDocument()
  })

  it('starts a fresh request and clears the chosen service', () => {
    const { onClearSelectedService } = setup(ACRYLIC_SHORT)

    fillContactDetails()
    submitForm()
    fireEvent.click(screen.getByRole('button', { name: /submit another request/i }))

    expect(screen.getByRole('button', { name: /request appointment/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toHaveValue('')
    expect(screen.getByLabelText(/phone number/i)).toHaveValue('')
    expect(onClearSelectedService).toHaveBeenCalledTimes(1)
  })

  it('confirms the request without nesting invalid markup', () => {
    // React logs when a `<p>` is given block-level children, which also breaks
    // hydration on a real page. Guard the success callout against regressing.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const invalidNesting =
      /cannot contain a nested|cannot be a descendant of|validateDOMNesting/i

    setup(ACRYLIC_SHORT)
    fillContactDetails()
    submitForm()

    expect(screen.getByText(/Appointment Request Received/)).toBeInTheDocument()
    const warnings = errorSpy.mock.calls
      .map((call) => String(call[0]))
      .filter((message) => invalidNesting.test(message))

    expect(warnings).toEqual([])
  })
})