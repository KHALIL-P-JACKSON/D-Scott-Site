import { Fragment, useEffect, useState } from 'react'
import {
  Container,
  Grid,
  Card,
  Flex,
  Heading,
  Text,
  Badge,
  Button,
  Select,
  TextField,
  TextArea,
  Callout,
} from '@radix-ui/themes'
import {
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Calendar,
  Sparkles,
  IdCard,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { SERVICE_OPTION_GROUPS } from '../../data/services'
import { loadAccount, readSiteHours, siteHoursRows } from '../../lib/account'
import { bookingGate, createBookingRequest } from '../../lib/bookings'
import type { AccountSnapshot, BookingFormData, BookingTimeSlot } from '../../types'
import './Booking.css'

interface BookingProps {
  selectedService: string
  onServiceChange?: (service: string) => void
  onClearSelectedService?: () => void
}

export function Booking({ selectedService, onServiceChange, onClearSelectedService }: BookingProps) {
  const [submitted, setSubmitted] = useState(false)
  const [serviceError, setServiceError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [account, setAccount] = useState<AccountSnapshot | null>(null)
  const [loadingAccount, setLoadingAccount] = useState(true)
  const [accountError, setAccountError] = useState('')
  const [accountRevision, setAccountRevision] = useState(0)
  const siteHours = readSiteHours()
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: 'morning',
    notes: '',
  })

  const currentService = selectedService
  const gate = bookingGate(account, loadingAccount)

  useEffect(() => {
    let active = true

    loadAccount().then((result) => {
      if (!active) {
        return
      }

      if (result.status === 'failed') {
        setLoadingAccount(false)
        setAccount(null)
        setAccountError(result.error)
        return
      }

      const snapshot = result.account
      setAccountError('')
      setLoadingAccount(false)
      setAccount(snapshot)

      // A signed-in client should not have to retype what the studio already
      // holds; fill only the fields they have not touched yet.
      if (snapshot) {
        setFormData((current) => ({
          ...current,
          name: current.name || snapshot.profile?.full_name || '',
          phone: current.phone || snapshot.profile?.phone || '',
          email: current.email || snapshot.email || '',
        }))
      }
    })

    return () => {
      active = false
    }
  }, [accountRevision])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedService.trim()) {
      setServiceError('Please select a service before submitting.')
      return
    }

    setServiceError('')
    setRequestError('')

    if (!account) {
      setRequestError('Please sign in before requesting an appointment.')
      return
    }

    setSubmitting(true)

    const { error } = await createBookingRequest(account, {
      serviceOption: selectedService,
      preferredDate: formData.date,
      timeSlot: formData.time as BookingTimeSlot,
      notes: formData.notes,
    })

    setSubmitting(false)

    if (error) {
      setRequestError(error)
      return
    }

    setSubmitted(true)
  }

  const handleReset = () => {
    setSubmitted(false)
    setServiceError('')
    setRequestError('')
    setFormData({
      name: '',
      phone: '',
      email: '',
      date: '',
      time: 'morning',
      notes: '',
    })
    if (onClearSelectedService) {
      onClearSelectedService()
    }
  }

  return (
    <section id="booking" className="radix-booking-section">
      <Container size="4">
        <Card size="4" variant="classic" className="radix-booking-main-card">
          <Grid columns={{ initial: '1', md: '12' }} gap="0">
            {/* Left Column: Hours & Studio Info */}
            <Flex
              gridColumn={{ initial: 'span 12', md: 'span 5' }}
              direction="column"
              justify="between"
              className="booking-side-info"
              id="hours"
            >
              <Flex direction="column" gap="4">
                <Flex>
                  <Badge color="ruby" variant="solid" size="2" radius="full">
                    <Sparkles size={13} /> Reserve Your Visit
                  </Badge>
                </Flex>

                <Heading as="h3" size="7" className="side-info-heading">
                  Visit D'Luxe Beauty Studio
                </Heading>
                <Text size="3" className="side-info-desc">
                  Select your service and preferred date. Our concierge team will reach out promptly to confirm your slot.
                </Text>

                <Flex direction="column" gap="4" mt="3">
                  <Flex gap="3" align="start">
                    <Flex className="side-info-icon">
                      <MapPin size={20} />
                    </Flex>
                    <Flex direction="column">
                      <Text size="2" weight="bold" className="side-info-label">Studio Location</Text>
                      <Text size="2" className="side-info-val">Stockbridge, GA</Text>
                    </Flex>
                  </Flex>

                  <Flex gap="3" align="start">
                    <Flex className="side-info-icon">
                      <Clock size={20} />
                    </Flex>
                    <Flex direction="column">
                      <Text size="2" weight="bold" className="side-info-label">Studio Hours</Text>
                      {siteHoursRows(siteHours).map(({ label, value }) => (
                        <Text key={label} size="2" className="side-info-val">
                          {label}: {value}
                        </Text>
                      ))}
                    </Flex>
                  </Flex>

                  <Flex gap="3" align="start">
                    <Flex className="side-info-icon">
                      <Phone size={20} />
                    </Flex>
                    <Flex direction="column">
                      <Text size="2" weight="bold" className="side-info-label">Call or Text Direct</Text>
                      <Text size="2" className="side-info-val">(555) 234-5678</Text>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>

              <Card variant="surface" className="side-info-tip" mt="5">
                <Text size="2">
                  💡 <strong>Need same-day pampering?</strong> Call or text us directly for immediate walk-in availability!
                </Text>
              </Card>
            </Flex>

            {/* Right Column: Interactive Booking Form */}
            <Flex
              gridColumn={{ initial: 'span 12', md: 'span 7' }}
              direction="column"
              justify="center"
              p={{ initial: '5', md: '7' }}
              className="booking-form-wrapper"
            >
              {gate === 'loading' ? (
                <Flex direction="column" align="center" py="6">
                  <Text size="2" color="gray">
                    Checking your account…
                  </Text>
                </Flex>
              ) : accountError ? (
                <Callout.Root color="ruby" size="3" variant="surface" className="booking-gate-callout">
                  <Callout.Icon>
                    <AlertCircle size={24} />
                  </Callout.Icon>
                  <Callout.Text>
                    <strong>Could not check your account.</strong> {accountError}{' '}
                    <Button
                      size="1"
                      variant="soft"
                      color="ruby"
                      ml="2"
                      onClick={() => setAccountRevision((r) => r + 1)}
                    >
                      Try again
                    </Button>
                  </Callout.Text>
                </Callout.Root>
              ) : gate === 'signed-out' ? (
                <Callout.Root color="ruby" size="3" variant="surface" className="booking-gate-callout">
                  <Callout.Icon>
                    <IdCard size={24} />
                  </Callout.Icon>
                  <Callout.Text>
                    <strong>Sign in to request an appointment.</strong> An account keeps your details
                    and your ID on file, so your next booking takes a minute.{' '}
                    <a href="#/account" className="booking-gate-link">
                      Create an account or sign in
                    </a>
                  </Callout.Text>
                </Callout.Root>
              ) : gate === 'needs-id' ? (
                <Callout.Root
                  color="amber"
                  size="3"
                  variant="surface"
                  className="booking-gate-callout"
                >
                  <Callout.Icon>
                    <ShieldCheck size={24} />
                  </Callout.Icon>
                  <Callout.Text>
                    <strong>One step left.</strong> Upload a government-issued photo ID to your
                    account before your first appointment.{' '}
                    <a href="#/account" className="booking-gate-link">
                      Upload your ID
                    </a>
                  </Callout.Text>
                </Callout.Root>
              ) : submitted ? (
                <Callout.Root color="green" size="3" variant="surface" className="booking-success-callout">
                  <Callout.Icon>
                    <CheckCircle2 size={24} />
                  </Callout.Icon>
                  {/* A plain wrapper: the default `<p>` of `Callout.Text` cannot
                      legally contain the heading and paragraphs below, which
                      would break hydration. */}
                  <div className="booking-success-body">
                    <Heading as="h4" size="4" mb="1">Appointment Request Received!</Heading>
                    <Text size="3" as="p" mb="2">
                      Thank you, <strong>{formData.name}</strong>! We have received your request for{' '}
                      <strong>{currentService || 'your selected service'}</strong>.
                    </Text>
                    <Text size="2" color="gray" as="p" mb="4">
                      Our front desk will contact you at <strong>{formData.phone}</strong> shortly to confirm your booking time.
                    </Text>
                    <Button variant="solid" color="green" radius="full" onClick={handleReset}>
                      Submit Another Request
                    </Button>
                  </div>
                </Callout.Root>
              ) : (
                <form onSubmit={handleSubmit}>
                  <Flex direction="column" gap="4">
                    <Flex direction="column" gap="1">
                      <Text as="label" htmlFor="booking-name" size="2" weight="bold">Full Name *</Text>
                      <TextField.Root
                        id="booking-name"
                        size="3"
                        required
                        placeholder="e.g. Ashley Davis"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </Flex>

                    <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                      <Flex direction="column" gap="1">
                        <Text as="label" htmlFor="booking-phone" size="2" weight="bold">Phone Number *</Text>
                        <TextField.Root
                          id="booking-phone"
                          size="3"
                          type="tel"
                          required
                          placeholder="(555) 000-0000"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </Flex>
                      <Flex direction="column" gap="1">
                        <Text as="label" htmlFor="booking-email" size="2" weight="bold">Email Address</Text>
                        <TextField.Root
                          id="booking-email"
                          size="3"
                          type="email"
                          placeholder="ashley@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </Flex>
                    </Grid>

                    <Flex direction="column" gap="1">
                      <Text as="label" id="booking-service-label" size="2" weight="bold">Select Service *</Text>
                      <Select.Root
                        size="3"
                        value={selectedService}
                        onValueChange={(val) => {
                          onServiceChange?.(val)
                          setServiceError('')
                        }}
                      >
                        <Select.Trigger aria-labelledby="booking-service-label" placeholder="Choose Nail Service" />
                        <Select.Content position="popper">
                          {SERVICE_OPTION_GROUPS.map((group, index) => (
                            <Fragment key={group.label}>
                              {index > 0 ? <Select.Separator /> : null}
                              <Select.Group>
                                <Select.Label>{group.label}</Select.Label>
                                {group.options.map((option) => (
                                  <Select.Item key={option.value} value={option.value}>
                                    {option.label}
                                  </Select.Item>
                                ))}
                              </Select.Group>
                            </Fragment>
                          ))}
                        </Select.Content>
                      </Select.Root>
                      {serviceError ? (
                        <Text size="2" color="red">{serviceError}</Text>
                      ) : null}
                    </Flex>

                    <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                      <Flex direction="column" gap="1">
                        <Text as="label" htmlFor="booking-date" size="2" weight="bold">Preferred Date *</Text>
                        <TextField.Root
                          id="booking-date"
                          size="3"
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </Flex>
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">Preferred Time</Text>
                        <Select.Root
                          size="3"
                          value={formData.time}
                          onValueChange={(val) => setFormData({ ...formData, time: val })}
                        >
                          <Select.Trigger aria-label="Preferred time" />
                          <Select.Content position="popper">
                            <Select.Item value="morning">Morning (9am - 12pm)</Select.Item>
                            <Select.Item value="afternoon">Afternoon (12pm - 4pm)</Select.Item>
                            <Select.Item value="evening">Evening (4pm - 7pm)</Select.Item>
                          </Select.Content>
                        </Select.Root>
                      </Flex>
                    </Grid>

                    <Flex direction="column" gap="1">
                      <Text as="label" htmlFor="booking-notes" size="2" weight="bold">Notes / Special Requests (Optional)</Text>
                      <TextArea
                        id="booking-notes"
                        size="3"
                        rows={3}
                        placeholder="Share your nail length, shape, art inspo, or coupon codes like GLOW15..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </Flex>

                    {requestError ? (
                      <Callout.Root color="red" size="2" variant="surface" role="alert">
                        <Callout.Icon>
                          <AlertCircle size={18} />
                        </Callout.Icon>
                        <Callout.Text>{requestError}</Callout.Text>
                      </Callout.Root>
                    ) : null}

                    <Button
                      type="submit"
                      size="3"
                      color="ruby"
                      variant="solid"
                      radius="full"
                      highContrast
                      mt="2"
                      loading={submitting}
                    >
                      <Calendar size={16} /> Request Appointment
                    </Button>
                  </Flex>
                </form>
              )}
            </Flex>
          </Grid>
        </Card>
      </Container>
    </section>
  )
}
