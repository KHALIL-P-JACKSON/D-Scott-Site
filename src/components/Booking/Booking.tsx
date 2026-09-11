import { useState } from 'react'
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
import { MapPin, Clock, Phone, CheckCircle2, Calendar, Sparkles } from 'lucide-react'
import type { BookingFormData } from '../../types'
import './Booking.css'

interface BookingProps {
  selectedService: string
  onServiceChange?: (service: string) => void
  onClearSelectedService?: () => void
}

export function Booking({ selectedService, onServiceChange, onClearSelectedService }: BookingProps) {
  const [submitted, setSubmitted] = useState(false)
  const [serviceError, setServiceError] = useState('')
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    phone: '',
    email: '',
    service: selectedService,
    date: '',
    time: 'morning',
    notes: '',
  })

  const currentService = selectedService

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedService.trim()) {
      setServiceError('Please select a service before submitting.')
      return
    }

    setServiceError('')
    setSubmitted(true)
  }

  const handleReset = () => {
    setSubmitted(false)
    setServiceError('')
    setFormData({
      name: '',
      phone: '',
      email: '',
      service: '',
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
                  Visit D. Scott Studio
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
                      <Text size="2" className="side-info-val">124 Main Street, Suite 200, Downtown</Text>
                    </Flex>
                  </Flex>

                  <Flex gap="3" align="start">
                    <Flex className="side-info-icon">
                      <Clock size={20} />
                    </Flex>
                    <Flex direction="column">
                      <Text size="2" weight="bold" className="side-info-label">Studio Hours</Text>
                      <Text size="2" className="side-info-val">Mon - Fri: 9:00 AM – 7:00 PM</Text>
                      <Text size="2" className="side-info-val">Saturday: 8:30 AM – 6:00 PM</Text>
                      <Text size="2" className="side-info-val">Sunday: 10:00 AM – 4:00 PM</Text>
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
              {submitted ? (
                <Callout.Root color="green" size="3" variant="surface" className="booking-success-callout">
                  <Callout.Icon>
                    <CheckCircle2 size={24} />
                  </Callout.Icon>
                  <Callout.Text>
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
                  </Callout.Text>
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
                        value={selectedService || undefined}
                        onValueChange={(val) => {
                          const nextService = val === 'none' ? '' : val
                          if (onServiceChange) {
                            onServiceChange(nextService)
                          }
                          setFormData((prev) => ({ ...prev, service: nextService }))
                          setServiceError('')
                        }}
                      >
                        <Select.Trigger aria-labelledby="booking-service-label" placeholder="Choose Hair or Nail Service" />
                        <Select.Content position="popper">
                          <Select.Group>
                            <Select.Label>Hair Studio</Select.Label>
                            <Select.Item value="Signature Haircut & Blowout">Signature Haircut & Blowout ($65+)</Select.Item>
                            <Select.Item value="Custom Balayage & Gloss">Custom Balayage & Gloss ($175+)</Select.Item>
                            <Select.Item value="Hydrating Silk Press">Hydrating Silk Press ($85+)</Select.Item>
                            <Select.Item value="Keratin Smoothing Therapy">Keratin Smoothing Therapy ($195+)</Select.Item>
                          </Select.Group>
                          <Select.Separator />
                          <Select.Group>
                            <Select.Label>Nail Lounge</Select.Label>
                            <Select.Item value="Deluxe Gel Manicure">Deluxe Gel Manicure ($45)</Select.Item>
                            <Select.Item value="BIAB Builder Gel Overlay">BIAB Builder Gel Overlay ($65)</Select.Item>
                            <Select.Item value="Full Set Acrylics & Custom Art">Full Set Acrylics & Custom Art ($75+)</Select.Item>
                            <Select.Item value="Aromatherapy Spa Pedicure">Aromatherapy Spa Pedicure ($55)</Select.Item>
                          </Select.Group>
                          <Select.Separator />
                          <Select.Group>
                            <Select.Label>Combo Packages</Select.Label>
                            <Select.Item value="The 'Glow Up' Luxury Day">The "Glow Up" Luxury Day ($220)</Select.Item>
                            <Select.Item value="Weekly Glam Express">Weekly Glam Express ($95)</Select.Item>
                          </Select.Group>
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
                        placeholder="Share any hair length details, nail inspo ideas, or coupon codes like GLOW15..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </Flex>

                    <Button
                      type="submit"
                      size="3"
                      color="ruby"
                      variant="solid"
                      radius="full"
                      highContrast
                      mt="2"
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
