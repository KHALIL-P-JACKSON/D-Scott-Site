import { useState } from 'react'
import {
  AnnouncementBar,
  Navbar,
  Hero,
  Services,
  Perks,
  Reviews,
  Booking,
  Footer,
} from './components'
import './App.css'

function App() {
  const [selectedService, setSelectedService] = useState<string>('')

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
        <Hero />
        <Services onSelectService={handleSelectService} />
        <Perks />
        <Reviews />
        <Booking
          selectedService={selectedService}
          onServiceChange={handleServiceChange}
          onClearSelectedService={() => setSelectedService('')}
        />
      </main>
      <Footer />
    </div>
  )
}

export default App


