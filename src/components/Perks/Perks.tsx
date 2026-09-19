import { Container, Grid, Card, Flex, Heading, Text, Badge } from '@radix-ui/themes'
import { Leaf, Sparkles, Coffee, Heart } from 'lucide-react'
import './Perks.css'

export function Perks() {
  const perks = [
    {
      icon: <Leaf size={24} />,
      title: 'Non-Toxic & Clean',
      desc: 'We use gentle, HEMA-free acrylics, 10-free gel polishes, and vegan nail care products for healthy nails.',
      color: 'green' as const,
    },
    {
      icon: <Sparkles size={24} />,
      title: 'Hospital-Grade Clean',
      desc: 'Medical autoclave sanitation for all metal implements and single-use files. Your safety and peace of mind come first.',
      color: 'ruby' as const,
    },
    {
      icon: <Coffee size={24} />,
      title: 'Complimentary Bar',
      desc: 'Unwind with iced espresso, artisan teas, chilled sparkling water, or wine while our master stylists pamper you.',
      color: 'amber' as const,
    },
    {
      icon: <Heart size={24} />,
      title: 'Custom Consultations',
      desc: 'Never rushed. We review your nail length, shape, and design inspo pictures to craft a set that truly fits you.',
      color: 'purple' as const,
    },
  ]

  return (
    <section id="why-us" className="radix-perks-section">
      <Container size="4">
        <Flex direction="column" align="center" gap="2" mb="6" style={{ textAlign: 'center' }}>
          <Badge size="2" color="ruby" variant="soft" radius="full">
            The Studio Experience
          </Badge>
          <Heading as="h2" size="8" className="radix-section-heading">
            Why Our Clients Love Us
          </Heading>
          <Text size="3" color="gray" style={{ maxWidth: '600px' }}>
            More than just an appointment—we provide high-end comfort, immaculate standards, and looks that turn heads.
          </Text>
        </Flex>

        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
          {perks.map((perk, index) => (
            <Card key={index} size="3" variant="surface" className="radix-perk-card">
              <Flex direction="column" align="center" gap="3" style={{ textAlign: 'center' }}>
                <Flex align="center" justify="center" className={`perk-icon-bubble bubble-${perk.color}`}>
                  {perk.icon}
                </Flex>
                <Heading as="h3" size="4" weight="bold">
                  {perk.title}
                </Heading>
                <Text size="2" color="gray" className="perk-desc-text">
                  {perk.desc}
                </Text>
              </Flex>
            </Card>
          ))}
        </Grid>
      </Container>
    </section>
  )
}
