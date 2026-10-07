import { useEffect, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  TextField,
} from '@radix-ui/themes'
import { IdCard, LogOut, Plus, Trash2 } from 'lucide-react'
import { SERVICE_CATEGORIES } from '../../data/services'
import {
  describeIdStatus,
  idFileError,
  loadAccount,
  readPricingCatalog,
  readSiteHours,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updatePricingCatalog,
  updateProfileDetails,
  updateSiteHours,
  uploadIdDocument,
  validateSignIn,
  validateSignUp,
} from '../../lib/account'
import { canBook } from '../../lib/bookings'
import type {
  AccountSnapshot,
  ServiceItem,
  ServiceVariant,
  SignInFields,
  SignUpFields,
} from '../../types'
import './Account.css'

type AccountView =
  | { status: 'loading' }
  | { status: 'failed'; error: string }
  | { status: 'signed-out' }
  | { status: 'signed-in'; account: AccountSnapshot }

const CONFIRM_EMAIL_NOTICE =
  'Almost there — confirm your email address, then sign in to finish setting up your account.'

const ID_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'

/**
 * React keys and both service handlers match on `id`, so a new service needs a
 * value that cannot collide with one already in the menu — a running count would
 * repeat itself as soon as a service is removed.
 */
function createCustomServiceId(): string {
  const unique =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

  return `custom-service-${unique}`
}

export function Account() {
  const [view, setView] = useState<AccountView>({ status: 'loading' })
  const [revision, setRevision] = useState(0)

  // Re-reading on demand keeps one source of truth: every successful action
  // bumps `revision` rather than patching a copy of the account held in state.
  useEffect(() => {
    let active = true

    loadAccount().then((result) => {
      if (!active) {
        return
      }

      if (result.status === 'failed') {
        setView({ status: 'failed', error: result.error })
      } else if (result.account) {
        setView({ status: 'signed-in', account: result.account })
      } else {
        setView({ status: 'signed-out' })
      }
    })

    return () => {
      active = false
    }
  }, [revision])

  const refresh = () => setRevision((current) => current + 1)

  /**
   * Trusts the session auth just handed back, so the page never blanks a
   * signed-in client back to the signup cards when the profile read stumbles.
   * `loadAccount` only enriches: if it returns nothing, the session stands.
   */
  async function adoptSession(account: AccountSnapshot) {
    setView({ status: 'signed-in', account })

    const enriched = await loadAccount()

    if (enriched.status === 'ok' && enriched.account) {
      setView({ status: 'signed-in', account: enriched.account })
    }
  }

  return (
    <section id="account" className="radix-account-section">
      <Container size="4">
        <Flex direction="column" gap="3" align="center" mb="7">
          <Badge color="ruby" variant="solid" size="2" radius="full">
            <IdCard size={13} /> Account &amp; ID Check
          </Badge>
          <Heading as="h1" size="8" align="center" className="account-heading">
            Your D'Luxe Account
          </Heading>
          <Text size="3" color="gray" align="center" className="account-intro">
            An account keeps your details on file and verifies you once, so booking a set takes a
            minute. Your ID is only ever used to confirm who is in the chair.
          </Text>
        </Flex>

        {view.status === 'loading' ? (
          <Text size="2" color="gray" align="center">
            Checking your session…
          </Text>
        ) : view.status === 'failed' ? (
          <Flex direction="column" align="center" gap="3" py="4">
            <Text size="2" color="red" align="center">
              {view.error || 'Failed to load your account.'}
            </Text>
            <Button size="2" variant="soft" color="ruby" onClick={refresh}>
              Try again
            </Button>
          </Flex>
        ) : view.status === 'signed-out' ? (
          <Grid columns={{ initial: '1', md: '2' }} gap="5">
            <SignUpCard onSignedUp={adoptSession} />
            <SignInCard onSignedIn={adoptSession} />
          </Grid>
        ) : (
          <SignedInPanels account={view.account} onChanged={refresh} />
        )}
      </Container>
    </section>
  )
}

function SignedInPanels({
  account,
  onChanged,
}: {
  account: AccountSnapshot
  onChanged: () => void
}) {
  const [message, setMessage] = useState('')
  const cleared = canBook(account.profile)

  async function handleSignOut() {
    const result = await signOut()

    if (result.error) {
      setMessage(result.error)
      return
    }

    onChanged()
  }

  return (
    <Flex direction="column" gap="5">
      <Card size="4" variant="classic" className="account-card">
        <Flex justify="between" align="start" wrap="wrap" gap="3">
          <Flex direction="column" gap="1">
            <Heading as="h2" size="5">
              Your account
            </Heading>
            <Text size="2" color="gray">
              Signed in as <strong>{account.email}</strong>
            </Text>
            <Text size="2" color={cleared ? 'green' : 'amber'} weight="medium">
              {cleared
                ? 'Your ID is on file — you are cleared to book.'
                : 'Add your photo ID below to unlock booking.'}
            </Text>
            {message ? (
              <Text size="2" color="red">
                {message}
              </Text>
            ) : null}
          </Flex>

          <Flex direction="column" gap="2" align="end">
            <Button variant="soft" color="gray" radius="full" type="button" onClick={handleSignOut}>
              <LogOut size={15} /> Sign out
            </Button>
            {cleared ? (
              <Button asChild variant="solid" color="ruby" radius="full" highContrast>
                <a href="#booking">Request an appointment</a>
              </Button>
            ) : null}
          </Flex>
        </Flex>
      </Card>

      {account.profile?.is_admin ? <AdminHoursPanel /> : null}
      {account.profile?.is_admin ? <AdminPricingPanel /> : null}
      <IdPanel account={account} onChanged={onChanged} />
      <DetailsPanel account={account} onChanged={onChanged} />
    </Flex>
  )
}

function SignUpCard({ onSignedUp }: { onSignedUp: (account: AccountSnapshot) => void }) {
  const [fields, setFields] = useState<SignUpFields>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const problems = validateSignUp(fields)
    setErrors(problems)

    if (Object.keys(problems).length > 0) {
      return
    }

    setBusy(true)
    setMessage('')

    const result = await signUpWithEmail(fields)

    setBusy(false)

    if (result.error) {
      setMessage(result.error)
      return
    }

    if (result.needsConfirmation) {
      setMessage(CONFIRM_EMAIL_NOTICE)
      return
    }

    // No session here by construction, so the client stays signed out.
    if (result.account) {
      onSignedUp(result.account)
    }
  }

  return (
    <Card size="4" variant="classic" className="account-card">
      <Flex direction="column" gap="4">
        <Flex direction="column" gap="1">
          <Heading as="h2" size="5">
            Create an account
          </Heading>
          <Text size="2" color="gray">
            New clients start here — it takes a minute, and you only have to do it once.
          </Text>
        </Flex>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="account-name" size="2" weight="bold">
                Full Name *
              </Text>
              <TextField.Root
                id="account-name"
                size="3"
                placeholder="e.g. Ashley Davis"
                value={fields.fullName}
                onChange={(event) => setFields({ ...fields, fullName: event.target.value })}
              />
              <FieldError message={errors.fullName} />
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="account-email" size="2" weight="bold">
                Email Address *
              </Text>
              <TextField.Root
                id="account-email"
                size="3"
                type="email"
                placeholder="ashley@example.com"
                value={fields.email}
                onChange={(event) => setFields({ ...fields, email: event.target.value })}
              />
              <FieldError message={errors.email} />
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="account-password" size="2" weight="bold">
                Password *
              </Text>
              <TextField.Root
                id="account-password"
                size="3"
                type="password"
                placeholder="At least 8 characters"
                value={fields.password}
                onChange={(event) => setFields({ ...fields, password: event.target.value })}
              />
              <FieldError message={errors.password} />
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="account-confirm" size="2" weight="bold">
                Confirm Password *
              </Text>
              <TextField.Root
                id="account-confirm"
                size="3"
                type="password"
                value={fields.confirmPassword}
                onChange={(event) => setFields({ ...fields, confirmPassword: event.target.value })}
              />
              <FieldError message={errors.confirmPassword} />
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="account-phone" size="2" weight="bold">
                Phone Number
              </Text>
              <TextField.Root
                id="account-phone"
                size="3"
                type="tel"
                placeholder="(555) 000-0000"
                value={fields.phone}
                onChange={(event) => setFields({ ...fields, phone: event.target.value })}
              />
            </Flex>

            {message ? (
              <Text size="2" color="ruby" role="status">
                {message}
              </Text>
            ) : null}

            <Button
              type="submit"
              size="3"
              color="ruby"
              variant="solid"
              radius="full"
              highContrast
              loading={busy}
            >
              Create account
            </Button>
          </Flex>
        </form>
      </Flex>
    </Card>
  )
}

function SignInCard({ onSignedIn }: { onSignedIn: (account: AccountSnapshot) => void }) {
  const [fields, setFields] = useState<SignInFields>({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const problems = validateSignIn(fields)
    setErrors(problems)

    if (Object.keys(problems).length > 0) {
      return
    }

    setBusy(true)
    setMessage('')

    const result = await signInWithEmail(fields)

    setBusy(false)

    if (result.error) {
      setMessage(result.error)
      return
    }

    if (result.account) {
      onSignedIn(result.account)
    }
  }

  return (
    <Card size="4" variant="classic" className="account-card">
      <Flex direction="column" gap="4">
        <Flex direction="column" gap="1">
          <Heading as="h2" size="5">
            Sign in
          </Heading>
          <Text size="2" color="gray">
            Already booked with us? Sign in to request your next appointment.
          </Text>
        </Flex>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="signin-email" size="2" weight="bold">
                Email Address *
              </Text>
              <TextField.Root
                id="signin-email"
                size="3"
                type="email"
                placeholder="ashley@example.com"
                value={fields.email}
                onChange={(event) => setFields({ ...fields, email: event.target.value })}
              />
              <FieldError message={errors.email} />
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="signin-password" size="2" weight="bold">
                Password *
              </Text>
              <TextField.Root
                id="signin-password"
                size="3"
                type="password"
                value={fields.password}
                onChange={(event) => setFields({ ...fields, password: event.target.value })}
              />
              <FieldError message={errors.password} />
            </Flex>

            {message ? (
              <Text size="2" color="ruby" role="status">
                {message}
              </Text>
            ) : null}

            <Button
              type="submit"
              size="3"
              color="ruby"
              variant="soft"
              radius="full"
              loading={busy}
            >
              Sign in
            </Button>
          </Flex>
        </form>
      </Flex>
    </Card>
  )
}

function IdPanel({ account, onChanged }: { account: AccountSnapshot; onChanged: () => void }) {
  const status = account.profile?.id_status ?? 'unverified'
  const copy = describeIdStatus(status)
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleUpload() {
    if (!file) {
      setMessage('Choose a photo or PDF of your ID first.')
      return
    }

    const problem = idFileError(file)

    if (problem) {
      setMessage(problem)
      return
    }

    setBusy(true)
    setMessage('')

    const result = await uploadIdDocument(account.userId, file)

    setBusy(false)

    if (result.error) {
      setMessage(result.error)
      return
    }

    setFile(null)
    setMessage('Thank you — your ID is on file and waiting for the studio to review it.')
    onChanged()
  }

  return (
    <Card size="4" variant="classic" className="account-card">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="start" wrap="wrap" gap="3">
          <Flex direction="column" gap="1">
            <Heading as="h2" size="5">
              Photo ID
            </Heading>
            <Text size="2" color="gray">
              {copy.detail}
            </Text>
          </Flex>
          <Badge color={copy.color} variant="soft" size="2" radius="full">
            {copy.label}
          </Badge>
        </Flex>

        <Flex direction="column" gap="2">
          <Text as="label" htmlFor="account-id-file" size="2" weight="bold">
            Upload an ID (JPG, PNG, WEBP or PDF, up to 5 MB) *
          </Text>
          <input
            id="account-id-file"
            className="account-file-input"
            type="file"
            accept={ID_ACCEPT}
            onChange={(event) => {
              setMessage('')
              setFile(event.target.files?.[0] ?? null)
            }}
          />
          <Text size="1" color="gray">
            Stored privately — only you and the studio can open it, and we delete it on request.
          </Text>
        </Flex>

        {message ? (
          <Text size="2" color="ruby" role="status">
            {message}
          </Text>
        ) : null}

        <Button
          type="button"
          size="3"
          color="ruby"
          variant="solid"
          radius="full"
          loading={busy}
          onClick={handleUpload}
        >
          {account.profile?.id_path ? 'Replace ID' : 'Upload ID'}
        </Button>
      </Flex>
    </Card>
  )
}

function AdminHoursPanel() {
  const [hours, setHours] = useState(readSiteHours())
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function updateDay(day: keyof typeof hours, field: 'open' | 'close' | 'closed', value: string | boolean) {
    setHours((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [field]: value,
      },
    }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    try {
      const result = await updateSiteHours(hours)

      setMessage(result.error ? result.error : 'Saved the studio hours.')
    } finally {
      setBusy(false)
    }
  }

  const days = [
    ['mon', 'Monday'],
    ['tue', 'Tuesday'],
    ['wed', 'Wednesday'],
    ['thu', 'Thursday'],
    ['fri', 'Friday'],
    ['sat', 'Saturday'],
    ['sun', 'Sunday'],
  ] as const

  return (
    <Card size="4" variant="classic" className="account-card">
      <Flex direction="column" gap="4">
        <Flex direction="column" gap="1">
          <Heading as="h2" size="5">
            Studio Hours
          </Heading>
          <Text size="2" color="gray">
            Update the public hours shown across the site.
          </Text>
        </Flex>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            {days.map(([day, label]) => (
              <Flex key={day} align="center" justify="between" gap="3" wrap="wrap">
                <Text size="2" weight="bold" style={{ minWidth: '6rem' }}>
                  {label}
                </Text>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={hours[day].closed}
                    onChange={(event) => updateDay(day, 'closed', event.target.checked)}
                  />
                  <Text size="2">Closed</Text>
                </label>

                {!hours[day].closed ? (
                  <>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Text as="span" size="2">Open</Text>
                      <TextField.Root
                        size="2"
                        type="time"
                        aria-label={`${label} open`}
                        value={hours[day].open}
                        onChange={(event) => updateDay(day, 'open', event.target.value)}
                      />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Text as="span" size="2">Close</Text>
                      <TextField.Root
                        size="2"
                        type="time"
                        aria-label={`${label} close`}
                        value={hours[day].close}
                        onChange={(event) => updateDay(day, 'close', event.target.value)}
                      />
                    </label>
                  </>
                ) : null}
              </Flex>
            ))}

            {message ? (
              <Text size="2" color={message.startsWith('Saved') ? 'green' : 'red'} role="status">
                {message}
              </Text>
            ) : null}

            <Button type="submit" size="3" color="ruby" variant="solid" radius="full" loading={busy}>
              Save studio hours
            </Button>
          </Flex>
        </form>
      </Flex>
    </Card>
  )
}

function AdminPricingPanel() {
  const [catalog, setCatalog] = useState(() => readPricingCatalog())
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function newService(category = SERVICE_CATEGORIES[0].id): ServiceItem {
    const serviceNumber = catalog.services.length + 1

    return {
      id: createCustomServiceId(),
      category,
      title: `New Service ${serviceNumber}`,
      price: '$0',
      duration: '30 min',
      desc: 'Describe what this service includes.',
      variants: [{ label: 'Standard', price: '$0' }],
    }
  }

  function updateService(serviceId: string, patch: Partial<ServiceItem>) {
    setCatalog((current) => ({
      ...current,
      services: current.services.map((service) =>
        service.id === serviceId ? { ...service, ...patch } : service,
      ),
    }))
  }

  function updateVariant(serviceId: string, variantIndex: number, patch: Partial<ServiceVariant>) {
    setCatalog((current) => ({
      ...current,
      services: current.services.map((service) => {
        if (service.id !== serviceId) {
          return service
        }

        const variants = [...(service.variants ?? [])]
        variants[variantIndex] = { ...variants[variantIndex], ...patch }

        return { ...service, variants }
      }),
    }))
  }

  function addVariant(serviceId: string) {
    setCatalog((current) => ({
      ...current,
      services: current.services.map((service) => {
        if (service.id !== serviceId) {
          return service
        }

        const variants = [...(service.variants ?? []), { label: 'New option', price: '$0' }]
        return { ...service, variants }
      }),
    }))
  }

  function removeVariant(serviceId: string, variantIndex: number) {
    setCatalog((current) => ({
      ...current,
      services: current.services.map((service) => {
        if (service.id !== serviceId) {
          return service
        }

        const variants = (service.variants ?? []).filter((_, index) => index !== variantIndex)
        return { ...service, variants: variants.length > 0 ? variants : undefined }
      }),
    }))
  }

  function addService() {
    setCatalog((current) => ({
      ...current,
      services: [...current.services, newService(current.services[0]?.category ?? SERVICE_CATEGORIES[0].id)],
    }))
  }

  function removeService(serviceId: string) {
    setCatalog((current) => ({
      ...current,
      services: current.services.filter((service) => service.id !== serviceId),
    }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    try {
      const result = await updatePricingCatalog(catalog)

      setMessage(result.error ? result.error : 'Saved the pricing menu.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card size="4" variant="classic" className="account-card">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="start" gap="3" wrap="wrap">
          <Flex direction="column" gap="1">
            <Heading as="h2" size="5">
              Pricing Menu
            </Heading>
            <Text size="2" color="gray">
              Update the services, prices, and options guests see on the public menu.
            </Text>
          </Flex>

          <Button type="button" size="2" color="ruby" variant="soft" radius="full" onClick={addService}>
            <Plus size={14} /> Add service
          </Button>
        </Flex>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            {catalog.services.length === 0 ? (
              <Text size="2" color="gray">
                No services yet. Add one to start your pricing menu.
              </Text>
            ) : (
              catalog.services.map((service) => (
                <Card key={service.id} size="2" variant="surface" style={{ border: '1px solid rgba(128, 128, 128, 0.25)' }}>
                  <Flex direction="column" gap="3">
                    <Flex justify="between" align="center" gap="3" wrap="wrap">
                      <Text size="2" weight="bold">
                        {service.title || 'Service'}
                      </Text>

                      <Button
                        type="button"
                        size="1"
                        color="red"
                        variant="soft"
                        onClick={() => removeService(service.id)}
                      >
                        <Trash2 size={12} /> Remove
                      </Button>
                    </Flex>

                    <Flex direction="column" gap="3">
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">
                          Service title
                        </Text>
                        <TextField.Root
                          size="2"
                          value={service.title}
                          onChange={(event) => updateService(service.id, { title: event.target.value })}
                        />
                      </Flex>

                      <Flex gap="3" wrap="wrap">
                        <Flex direction="column" gap="1" style={{ flex: '1 1 160px' }}>
                          <Text as="label" size="2" weight="bold">
                            Category
                          </Text>
                          <select
                            value={service.category}
                            onChange={(event) => updateService(service.id, { category: event.target.value as ServiceItem['category'] })}
                            style={{
                              padding: '0.7rem 0.8rem',
                              borderRadius: '0.75rem',
                              border: '1px solid rgba(128, 128, 128, 0.35)',
                              background: 'transparent',
                            }}
                          >
                            {SERVICE_CATEGORIES.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.label}
                              </option>
                            ))}
                          </select>
                        </Flex>

                        <Flex direction="column" gap="1" style={{ flex: '1 1 150px' }}>
                          <Text as="label" size="2" weight="bold">
                            Price
                          </Text>
                          <TextField.Root
                            size="2"
                            value={service.price}
                            onChange={(event) => updateService(service.id, { price: event.target.value })}
                          />
                        </Flex>

                        <Flex direction="column" gap="1" style={{ flex: '1 1 140px' }}>
                          <Text as="label" size="2" weight="bold">
                            Duration
                          </Text>
                          <TextField.Root
                            size="2"
                            value={service.duration}
                            onChange={(event) => updateService(service.id, { duration: event.target.value })}
                          />
                        </Flex>
                      </Flex>

                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">
                          Description
                        </Text>
                        <textarea
                          value={service.desc}
                          onChange={(event) => updateService(service.id, { desc: event.target.value })}
                          rows={3}
                          style={{
                            width: '100%',
                            resize: 'vertical',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(128, 128, 128, 0.35)',
                            padding: '0.7rem 0.8rem',
                            background: 'transparent',
                          }}
                        />
                      </Flex>

                      <Flex direction="column" gap="2">
                        <Flex justify="between" align="center" gap="2">
                          <Text size="2" weight="bold">
                            Options / variants
                          </Text>
                          <Button
                            type="button"
                            size="1"
                            variant="soft"
                            color="gray"
                            onClick={() => addVariant(service.id)}
                          >
                            <Plus size={12} /> Add option
                          </Button>
                        </Flex>

                        {(service.variants ?? []).length === 0 ? (
                          <Text size="2" color="gray">
                            This service has no variant list.
                          </Text>
                        ) : (
                          (service.variants ?? []).map((variant, variantIndex) => (
                            <Flex key={`${service.id}-${variant.label}-${variantIndex}`} gap="2" wrap="wrap" align="center">
                              <Flex direction="column" gap="1" style={{ flex: '1 1 180px' }}>
                                <Text as="label" size="2" weight="bold">
                                  Label
                                </Text>
                                <TextField.Root
                                  size="2"
                                  value={variant.label}
                                  onChange={(event) =>
                                    updateVariant(service.id, variantIndex, { label: event.target.value })
                                  }
                                />
                              </Flex>

                              <Flex direction="column" gap="1" style={{ flex: '1 1 120px' }}>
                                <Text as="label" size="2" weight="bold">
                                  Price
                                </Text>
                                <TextField.Root
                                  size="2"
                                  value={variant.price}
                                  onChange={(event) =>
                                    updateVariant(service.id, variantIndex, { price: event.target.value })
                                  }
                                />
                              </Flex>

                              <Button
                                type="button"
                                size="1"
                                color="red"
                                variant="soft"
                                onClick={() => removeVariant(service.id, variantIndex)}
                                style={{ alignSelf: 'flex-end' }}
                              >
                                <Trash2 size={12} /> Remove
                              </Button>
                            </Flex>
                          ))
                        )}
                      </Flex>
                    </Flex>
                  </Flex>
                </Card>
              ))
            )}

            {message ? (
              <Text size="2" color={message.startsWith('Saved') ? 'green' : 'red'} role="status">
                {message}
              </Text>
            ) : null}

            <Button type="submit" size="3" color="ruby" variant="solid" radius="full" loading={busy}>
              Save pricing
            </Button>
          </Flex>
        </form>
      </Flex>
    </Card>
  )
}

function DetailsPanel({ account, onChanged }: { account: AccountSnapshot; onChanged: () => void }) {
  const [fields, setFields] = useState({
    fullName: account.profile?.full_name ?? '',
    phone: account.profile?.phone ?? '',
  })
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    const result = await updateProfileDetails(account.userId, fields)

    setBusy(false)
    setFailed(Boolean(result.error))
    setMessage(result.error ?? 'Saved — we will use these details on your next request.')

    if (!result.error) {
      onChanged()
    }
  }

  return (
    <Card size="4" variant="classic" className="account-card">
      <Flex direction="column" gap="4">
        <Flex direction="column" gap="1">
          <Heading as="h2" size="5">
            Your details
          </Heading>
          <Text size="2" color="gray">
            We use these to confirm your appointment. Your ID keeps them honest.
          </Text>
        </Flex>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="details-name" size="2" weight="bold">
                Full Name
              </Text>
              <TextField.Root
                id="details-name"
                size="3"
                value={fields.fullName}
                onChange={(event) => setFields({ ...fields, fullName: event.target.value })}
              />
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="details-phone" size="2" weight="bold">
                Phone Number
              </Text>
              <TextField.Root
                id="details-phone"
                size="3"
                type="tel"
                value={fields.phone}
                onChange={(event) => setFields({ ...fields, phone: event.target.value })}
              />
            </Flex>

            {message ? (
              <Text size="2" color={failed ? 'red' : 'green'} role="status">
                {message}
              </Text>
            ) : null}

            <Button
              type="submit"
              size="3"
              color="gray"
              variant="soft"
              radius="full"
              loading={busy}
            >
              Save details
            </Button>
          </Flex>
        </form>
      </Flex>
    </Card>
  )
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <Text size="1" color="red">
      {message}
    </Text>
  ) : null
}
