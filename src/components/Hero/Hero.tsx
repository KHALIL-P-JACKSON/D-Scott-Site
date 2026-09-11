import { Container, Grid, Box, Flex, Heading, Text, Badge, Button, Card, Separator } from '@radix-ui/themes'
import { Sparkles, Star, Scissors, Heart, Clock, ArrowRight, ShieldCheck } from 'lucide-react'
import './Hero.css'

export function Hero() {
  return (
    <header className="radix-hero-section">
      <Container size="4">
        <Grid columns={{ initial: '1', md: '12' }} gap="8" align="center">
          {/* Left Hero Content */}
          <Box gridColumn={{ initial: 'span 12', md: 'span 7' }}>
            <Flex direction="column" gap="4">
              <Flex>
                <Badge size="2" color="ruby" variant="soft" radius="full">
                  <Sparkles size={14} /> Premier Local Hair & Nail Lounge
                </Badge>
              </Flex>

              <Heading as="h1" className="radix-hero-title">
                Elevate Your Hair. <span className="title-highlight">Pamper Your Nails.</span>
              </Heading>

              <Text size="4" className="radix-hero-desc">
                Experience bespoke hair styling, vibrant color transformations, and artisan nail enhancements in an upscale, boutique environment crafted for your glow up.
              </Text>

              <Flex gap="3" wrap="wrap" pt="2">
                <a href="#booking" style={{ textDecoration: 'none' }}>
                  <Button size="4" color="ruby" variant="solid" radius="full" highContrast>
                    Book Your Appointment <ArrowRight size={18} />
                  </Button>
                </a>
                <a href="#services" style={{ textDecoration: 'none' }}>
                  <Button size="4" color="gray" variant="outline" radius="full">
                    Explore Services & Pricing
                  </Button>
                </a>
              </Flex>

              <Separator size="4" my="3" />

              <Flex gap={{ initial: '4', sm: '7' }} wrap="wrap">
                <Flex direction="column">
                  <Flex align="center" gap="1">
                    <Star size={18} fill="#f59e0b" color="#f59e0b" />
                    <Text size="5" weight="bold">4.9 / 5.0</Text>
                  </Flex>
                  <Text size="2" color="gray">350+ Local Reviews</Text>
                </Flex>

                <Flex direction="column">
                  <Flex align="center" gap="1">
                    <ShieldCheck size={18} color="var(--ruby-9)" />
                    <Text size="5" weight="bold">100% Clean</Text>
                  </Flex>
                  <Text size="2" color="gray">Non-Toxic Formulations</Text>
                </Flex>

                <Flex direction="column">
                  <Flex align="center" gap="1">
                    <Heart size={18} color="var(--ruby-9)" />
                    <Text size="5" weight="bold">10+ Years</Text>
                  </Flex>
                  <Text size="2" color="gray">Master Stylists & Artists</Text>
                </Flex>
              </Flex>
            </Flex>
          </Box>

          {/* Right Hero Visual Card */}
          <Box gridColumn={{ initial: 'span 12', md: 'span 5' }}>
            <Card size="4" variant="classic" className="radix-hero-card">
              <Flex direction="column" gap="4">
                <Flex justify="between" align="center">
                  <Badge color="ruby" variant="surface" size="2" radius="full">
                    Today at D. Scott
                  </Badge>
                  <Flex align="center" gap="2">
                    <span className="live-status-dot"></span>
                    <Text size="2" weight="bold" color="green">
                      Open Today Until 7:00 PM
                    </Text>
                  </Flex>
                </Flex>

                <Grid columns="2" gap="3">
                  <Card variant="surface" className="hero-feature-box">
                    <Flex direction="column" gap="2">
                      <Flex align="center" justify="center" className="feature-icon-wrapper hair-theme">
                        <Scissors size={22} />
                      </Flex>
                      <Heading as="h4" size="3">Hair Studio</Heading>
                      <Text size="1" color="gray">
                        Cuts, balayage, silk press, treatments & gloss
                      </Text>
                    </Flex>
                  </Card>

                  <Card variant="surface" className="hero-feature-box">
                    <Flex direction="column" gap="2">
                      <Flex align="center" justify="center" className="feature-icon-wrapper nail-theme">
                        <Sparkles size={22} />
                      </Flex>
                      <Heading as="h4" size="3">Nail Lounge</Heading>
                      <Text size="1" color="gray">
                        BIAB gel, custom acrylics, chrome & pedicures
                      </Text>
                    </Flex>
                  </Card>
                </Grid>

                <Card variant="ghost" className="radix-client-quote">
                  <Flex gap="2" align="start">
                    <Clock size={16} style={{ marginTop: '2px', color: 'var(--ruby-9)', flexShrink: 0 }} />
                    <Text size="2" style={{ fontStyle: 'italic' }}>
                      “D. Scott is the only salon I trust with both my blonde highlights and my BIAB overlay. Impeccable attention to detail!”
                    </Text>
                  </Flex>
                  <Text size="1" weight="bold" mt="2" style={{ textAlign: 'right' }}>
                    — Jessica M., Regular Client
                  </Text>
                </Card>
              </Flex>
            </Card>
          </Box>
        </Grid>
      </Container>
    </header>
  )
}
