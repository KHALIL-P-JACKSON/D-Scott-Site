import { useEffect, useState } from 'react'
import {
  AnnouncementBar,
  Navbar,
  Hero,
  Services,
  Perks,
  Reviews,
  Booking,
  Account,
  Footer,
} from './components'
import { parseRoute, sectionIdFromHash, type Route } from './lib/router'
import './App.css'

function App() {
  const [selectedService, setSelectedService] = useState<string>('')
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))

  // The URL hash is the only router a static GitHub Pages site needs: `#/account`
  // serves the account page, and every other hash stays an in-page anchor.
  useEffect(() => {
    const syncRoute = () => setRoute(parseRoute(window.location.hash))

    window.addEventListener('hashchange', syncRoute)

    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  // Arriving back from the account page, an in-page link must still land where it
  // points: the browser has already dealt with the hash by the time this renders.
  useEffect(() => {
    if (route !== 'home') {
      return
    }

    const sectionId = sectionIdFromHash(window.location.hash)

    if (sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [route])

  const handleSelectService = (title: string) => {
    setSelectedService(title)
    const bookingElement = document.getElementById('booking')
    if (bookingElement) {
      bookingElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleServiceChange = (service: string) => {
    setSelectedService(service)
  }

  return (
    <div className="page-wrapper">
      <AnnouncementBar />
      <Navbar />
      <main>
        {route === 'account' ? (
          <Account />
        ) : (
          <>
            <Hero />
            <Services onSelectService={handleSelectService} />
            <Perks />
            <Reviews />
            <Booking
              selectedService={selectedService}
              onServiceChange={handleServiceChange}
              onClearSelectedService={() => setSelectedService('')}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App


