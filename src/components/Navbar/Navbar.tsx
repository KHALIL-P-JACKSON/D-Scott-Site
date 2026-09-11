import { Container, Flex, Button, Text } from '@radix-ui/themes'
import { Phone, Calendar } from 'lucide-react'
import './Navbar.css'

export function Navbar() {
  return (
    <nav className="radix-navbar">
      <Container size="4">
        <Flex align="center" justify="between" py="3">
          {/* Brand */}
          <a href="#" className="radix-brand">
            <Text className="radix-brand-name">D. Scott</Text>
            <span className="radix-brand-tagline">Hair & Nail Studio</span>
          </a>

          {/* Links */}
          <Flex align="center" gap="6" className="radix-nav-links">
            <a href="#services" className="nav-link">Services</a>
            <a href="#why-us" className="nav-link">Why Us</a>
            <a href="#reviews" className="nav-link">Reviews</a>
            <a href="#hours" className="nav-link">Hours & Location</a>
          </Flex>

          {/* Action Group */}
          <Flex align="center" gap="4">
            <Button asChild variant="ghost" color="gray" size="2" highContrast>
              <a href="tel:5552345678" className="nav-phone-link">
                <Phone size={15} />
                <span className="phone-text">(555) 234-5678</span>
              </a>
            </Button>
            <Button asChild size="3" variant="solid" color="ruby" radius="full" highContrast>
              <a href="#booking">
                <Calendar size={16} />
                Book Appointment
              </a>
            </Button>
          </Flex>
        </Flex>
      </Container>
    </nav>
  )
}
