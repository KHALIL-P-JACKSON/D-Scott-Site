import { Container, Grid, Flex, Heading, Text, Separator } from '@radix-ui/themes'
import { MapPin, Phone, Mail, Camera } from 'lucide-react'
import './Footer.css'

export function Footer() {
  return (
    <footer className="radix-footer">
      <Container size="4">
        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="7" mb="6">
          {/* Brand Col */}
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading as="h4" size="5" className="footer-brand-title">
                D'Luxe Beauty
              </Heading>
              <Text size="1" weight="bold" className="footer-brand-tagline">
                Nail Studio
              </Text>
            </Flex>
            <Text size="2" className="footer-about-text">
              Your premier local boutique for sculpted acrylic sets, flawless fill ins, custom press-ons, and soothing self-care.
            </Text>
          </Flex>

          {/* Quick Links */}
          <Flex direction="column" gap="3">
            <Heading as="h5" size="3" className="footer-col-title">
              Quick Links
            </Heading>
            <Flex direction="column" gap="2">
              <a href="#services" className="footer-link">Acrylic Sets & Fill Ins</a>
              <a href="#services" className="footer-link">Gel, Press-Ons & Add-Ons</a>
              <a href="#booking" className="footer-link">Book Appointment</a>
              <a href="#why-us" className="footer-link">Studio Sanitation</a>
            </Flex>
          </Flex>

          {/* Hours */}
          <Flex direction="column" gap="3">
            <Heading as="h5" size="3" className="footer-col-title">
              Studio Hours
            </Heading>
            <Flex direction="column" gap="1">
              <Text size="2" className="footer-hour-row">Mon - Fri: 9:00am - 7:00pm</Text>
              <Text size="2" className="footer-hour-row">Saturday: 8:30am - 6:00pm</Text>
              <Text size="2" className="footer-hour-row">Sunday: 10:00am - 4:00pm</Text>
              <Text size="2" className="footer-highlight">Walk-ins Welcome Daily</Text>
            </Flex>
          </Flex>

          {/* Contact */}
          <Flex direction="column" gap="3">
            <Heading as="h5" size="3" className="footer-col-title">
              Find & Contact Us
            </Heading>
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                <MapPin size={16} color="var(--ruby-9)" />
                <Text size="2" className="footer-link">124 Main St, Suite 200</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Phone size={16} color="var(--ruby-9)" />
                <a href="tel:5552345678" className="footer-link">(555) 234-5678</a>
              </Flex>
              <Flex align="center" gap="2">
                <Mail size={16} color="var(--ruby-9)" />
                <a href="mailto:hello@dscottstudio.com" className="footer-link">hello@dscottstudio.com</a>
              </Flex>
              <Flex align="center" gap="2">
                <Camera size={16} color="var(--ruby-9)" />
                <span className="footer-link">@dscott.hairnails</span>
              </Flex>
            </Flex>
          </Flex>
        </Grid>

        <Separator size="4" my="5" style={{ background: 'rgba(255,255,255,0.1)' }} />

        <Flex justify="between" align="center" wrap="wrap" gap="3" className="footer-bottom-bar">
          <Text size="1" color="gray">
            © {new Date().getFullYear()} D'Luxe Beauty Nail Studio. All rights reserved.
          </Text>
          <Flex gap="4">
            <a href="#" className="footer-link footer-legal">Privacy Policy</a>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
            <a href="#" className="footer-link footer-legal">Terms of Service</a>
          </Flex>
        </Flex>
      </Container>
    </footer>
  )
}
