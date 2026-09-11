import { Container, Flex, Text, Badge } from '@radix-ui/themes'
import { Sparkles } from 'lucide-react'
import './AnnouncementBar.css'

export function AnnouncementBar() {
  return (
    <div className="announcement-bar-wrapper">
      <Container size="4">
        <Flex align="center" justify="center" gap="3" wrap="wrap" className="announcement-content">
          <Badge color="amber" variant="solid" radius="full" size="1">
            <Sparkles size={12} /> NEW CLIENT OFFER
          </Badge>
          <Text size="2" weight="medium" className="announcement-text">
            Get 15% off your first hair or nail appointment with code <strong>GLOW15</strong>
          </Text>
          <Text size="1" className="announcement-sub">
            • Walk-ins Welcome & By Appointment
          </Text>
        </Flex>
      </Container>
    </div>
  )
}
