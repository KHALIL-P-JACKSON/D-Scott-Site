import { useState } from 'react'
import { Container, Flex, Heading, Text, Badge, Card, Button, Tabs, Grid, Box } from '@radix-ui/themes'
import { Clock, ArrowRight } from 'lucide-react'
import { SERVICES } from '../../data/services'
import './Services.css'

interface ServicesProps {
  onSelectService: (title: string) => void
}

export function Services({ onSelectService }: ServicesProps) {
  const [activeTab, setActiveTab] = useState<string>('all')

  const filteredServices =
    activeTab === 'all'
      ? SERVICES
      : SERVICES.filter((s) => s.category === activeTab)

  return (
    <section id="services" className="radix-services-section">
      <Container size="4">
        {/* Section Header */}
        <Flex direction="column" align="center" gap="2" mb="6" style={{ textAlign: 'center' }}>
          <Badge size="2" color="ruby" variant="soft" radius="full">
            Menu & Pricing
          </Badge>
          <Heading as="h2" size="8" className="radix-section-heading">
            Artisan Hair & Nail Services
          </Heading>
          <Text size="3" color="gray" style={{ maxWidth: '600px' }}>
            Every appointment includes an individualized consultation and premium care products to ensure radiant, healthy results.
          </Text>
        </Flex>

        {/* Radix Tabs Component */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="radix-tabs-root">
          <Flex justify="center" mb="6">
            <Tabs.List size="2" highContrast>
              <Tabs.Trigger value="all">All Services</Tabs.Trigger>
              <Tabs.Trigger value="hair">Hair Studio</Tabs.Trigger>
              <Tabs.Trigger value="nails">Nail Lounge</Tabs.Trigger>
              <Tabs.Trigger value="packages">Combo Packages</Tabs.Trigger>
            </Tabs.List>
          </Flex>

          <Tabs.Content value={activeTab}>
            <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="5">
              {filteredServices.map((service) => (
                <Card key={service.id} size="3" variant="classic" className="radix-service-card">
                  <Flex direction="column" justify="between" style={{ height: '100%' }} gap="4">
                    <Box>
                      <Flex justify="between" align="start" gap="2" mb="2">
                        <Heading as="h3" size="4" weight="bold">
                          {service.title}
                        </Heading>
                        <Text size="5" weight="bold" className="radix-price-tag">
                          {service.price}
                        </Text>
                      </Flex>

                      <Flex align="center" gap="2" mb="3">
                        <Badge color="gray" variant="surface" size="1">
                          <Clock size={11} /> {service.duration}
                        </Badge>
                        <Badge
                          color={service.category === 'hair' ? 'ruby' : service.category === 'nails' ? 'amber' : 'purple'}
                          variant="soft"
                          size="1"
                        >
                          {service.category}
                        </Badge>
                      </Flex>

                      <Text size="2" color="gray" className="service-desc-text">
                        {service.desc}
                      </Text>
                    </Box>

                    <Button
                      variant="soft"
                      color="ruby"
                      size="2"
                      radius="medium"
                      className="radix-service-cta"
                      onClick={() => onSelectService(service.title)}
                    >
                      Book This Service <ArrowRight size={14} />
                    </Button>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Tabs.Content>
        </Tabs.Root>
      </Container>
    </section>
  )
}
