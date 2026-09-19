import { Container, Grid, Card, Flex, Heading, Text, Badge, Avatar } from '@radix-ui/themes'
import { Star, Quote } from 'lucide-react'
import { REVIEWS } from '../../data/reviews'
import './Reviews.css'

export function Reviews() {
  return (
    <section id="reviews" className="radix-reviews-section">
      <Container size="4">
        <Flex direction="column" align="center" gap="2" mb="6" style={{ textAlign: 'center' }}>
          <Badge size="2" color="ruby" variant="soft" radius="full">
            Client Love
          </Badge>
          <Heading as="h2" size="8" className="radix-section-heading">
            Loved by Our Community
          </Heading>
          <Text size="3" color="gray" style={{ maxWidth: '600px' }}>
            Genuine reviews from neighbors and loyal clients who trust D'Luxe Beauty with their nails.
          </Text>
        </Flex>

        <Grid columns={{ initial: '1', md: '3' }} gap="5">
          {REVIEWS.map((review) => (
            <Card key={review.id} size="3" variant="classic" className="radix-review-card">
              <Flex direction="column" justify="between" style={{ height: '100%' }} gap="4">
                <Flex direction="column" gap="3">
                  <Flex justify="between" align="center">
                    <Flex gap="1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </Flex>
                    <Quote size={20} color="var(--gray-7)" />
                  </Flex>

                  <Text size="3" className="review-quote-text">
                    {review.text}
                  </Text>
                </Flex>

                <Flex align="center" gap="3" pt="2" className="review-author-row">
                  <Avatar
                    size="3"
                    fallback={review.initials}
                    color="ruby"
                    variant="soft"
                    radius="full"
                  />
                  <Flex direction="column">
                    <Text size="2" weight="bold">
                      {review.name}
                    </Text>
                    <Text size="1" color="gray">
                      {review.service}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Grid>
      </Container>
    </section>
  )
}
