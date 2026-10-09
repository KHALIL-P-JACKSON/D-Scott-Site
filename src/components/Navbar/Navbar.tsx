import { Container, DropdownMenu, Flex, Button, Text } from '@radix-ui/themes'
import { Phone, Calendar, Menu } from 'lucide-react'
import './Navbar.css'

const NAV_LINKS = [
  { href: '#services', label: 'Services' },
  { href: '#why-us', label: 'Why Us' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#hours', label: 'Hours & Location' },
  { href: '#/account', label: 'Account' },
]

export function Navbar() {
  return (
    <nav className="radix-navbar" aria-label="Main navigation">
      <Container size="4">
        <Flex align="center" justify="between" py="3" className="radix-navbar-row">
          {/* Brand */}
          <a href="#" className="radix-brand">
            <Text className="radix-brand-name">D'Luxe Beauty</Text>
            <span className="radix-brand-tagline">Nail Studio</span>
          </a>

          {/* Links */}
          <Flex align="center" gap="6" className="radix-nav-links">
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} className="nav-link">{label}</a>
            ))}
          </Flex>

          {/* Action Group */}
          <Flex align="center" gap="4" className="radix-nav-actions">
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

          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger>
              <Button
                className="radix-mobile-menu-trigger"
                variant="soft"
                color="ruby"
                size="3"
                aria-label="Open navigation menu"
              >
                <Menu size={20} aria-hidden="true" />
                Menu
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" sideOffset={12} className="radix-mobile-menu-content">
              {NAV_LINKS.map(({ href, label }) => (
                <DropdownMenu.Item key={href} asChild>
                  <a href={href}>{label === 'Account' ? 'Account / Sign In' : label}</a>
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator />
              <DropdownMenu.Item asChild>
                <a href="#booking">
                  <Calendar size={16} aria-hidden="true" />
                  Book Appointment
                </a>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <a href="tel:5552345678">
                  <Phone size={16} aria-hidden="true" />
                  Call (555) 234-5678
                </a>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      </Container>
    </nav>
  )
}
