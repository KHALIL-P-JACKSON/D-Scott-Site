import { useEffect, useState } from 'react'
import { Container, Flex, Heading, Text, Badge, Card, Button, Tabs, Grid, Box } from '@radix-ui/themes'
import { Clock, ArrowRight } from 'lucide-react'
import { SERVICES, SERVICE_CATEGORIES, getDefaultServiceOption } from '../../data/services'
import { loadPricingCatalog, readPricingCatalog } from '../../lib/account'
import { getCtaLabel } from '../../lib/services'
import './Services.css'

interface ServicesProps {
  onSelectService: (title: string) => void
}

export function Services({ onSelectService }: ServicesProps) {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [services, setServices] = useState(SERVICES)

  useEffect(() => {
    let active = true

    const apply = async () => {
      const next = await loadPricingCatalog()

      if (active) {
        setServices(next.services)
      }
    }

    void apply()

    // A local save fires while the matching database write is still in flight, so
    // apply the browser copy the editor just wrote rather than racing the row.
    const handleUpdate = () => {
      if (active) {
        setServices(readPricingCatalog().services)
      }
    }

    window.addEventListener('dscott-pricing-updated', handleUpdate)

    return () => {
      active = false
      window.removeEventListener('dscott-pricing-updated', handleUpdate)
    }
  }, [])

  const filteredServices =
    activeTab === 'all'
      ? services
      : services.filter((s) => s.category === activeTab)

  return (
    <section id="services" className="radix-services-section">
      <Container size="4">
        {/* Section Header */}
        <Flex direction="column" align="center" gap="2" mb="6" style={{ textAlign: 'center' }}>
          <Badge size="2" color="ruby" variant="soft" radius="full">
            Menu & Pricing
          </Badge>
          <Heading as="h2" size="8" className="radix-section-heading">
            Acrylic, Gel &amp; Nail Artistry
          </Heading>
          <Text size="3" color="gray" style={{ maxWidth: '600px' }}>
            Every appointment includes an individualized consultation and premium, non-toxic products. Acrylic set and fill in pricing is based on the nail length you choose.
          </Text>
        </Flex>

        {/* Radix Tabs Component */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="radix-tabs-root">
          <Flex justify="center" mb="6">
            <Tabs.List size="2" highContrast className="services-tab-list">
              <Tabs.Trigger value="all">All Services</Tabs.Trigger>
              {SERVICE_CATEGORIES.map((category) => (
                <Tabs.Trigger key={category.id} value={category.id}>
                  {category.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Flex>

          <Tabs.Content value={activeTab}>
            <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="5">
              {filteredServices.map((service) => {
                const category = SERVICE_CATEGORIES.find((item) => item.id === service.category)

                return (
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

                        <Flex align="center" gap="2" mb="3" wrap="wrap">
                          <Badge color="gray" variant="surface" size="1">
                            <Clock size={11} /> {service.duration}
                          </Badge>
                          <Badge color={category?.color ?? 'ruby'} variant="soft" size="1">
                            {category?.label ?? service.category}
                          </Badge>
                        </Flex>

                        <Text size="2" color="gray" className="service-desc-text">
                          {service.desc}
                        </Text>

                        {service.variants ? (
                          <Flex direction="column" gap="2" mt="3" className="service-variant-list">
                            {service.variants.map((variant) => (
                              <Flex
                                key={variant.label}
                                justify="between"
                                align="center"
                                gap="2"
                                className="service-variant-row"
                              >
                                <Text size="2" className="service-variant-label">
                                  {variant.label}
                                </Text>
                                <Text size="2" weight="bold" className="service-variant-price">
                                  {variant.price}
                                </Text>
                              </Flex>
                            ))}
                          </Flex>
                        ) : null}
                      </Box>

                      <Button
                        variant="soft"
                        color="ruby"
                        size="2"
                        radius="medium"
                        className="radix-service-cta"
                        onClick={() => onSelectService(getDefaultServiceOption(service))}
                      >
                        {getCtaLabel(service)} <ArrowRight size={14} />
                      </Button>
                    </Flex>
                  </Card>
                )
              })}
            </Grid>
          </Tabs.Content>
        </Tabs.Root>
      </Container>
    </section>
  )
}
