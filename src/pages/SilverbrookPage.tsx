import { useEffect, useMemo } from 'react'
import { STANDS, summarise } from '../data/stands'
import Nav, { type NavLink } from '../components/Nav'
import Hero from '../components/Hero'
import Estate from '../components/Estate'
import AvailabilityShowcase from '../components/AvailabilityShowcase'
import ImageBreak from '../components/ImageBreak'
import Gallery from '../components/Gallery'
import HowItWorks from '../components/HowItWorks'
import Enquire from '../components/Enquire'
import Footer from '../components/Footer'

const LINKS: NavLink[] = [
  { label: 'The Estate', href: '#estate' },
  { label: 'Availability', href: '#availability' },
  { label: 'Progress', href: '#progress' },
  { label: 'How it works', href: '#how' },
]

const FOOTER_LINKS: NavLink[] = [
  { label: 'The Estate', href: '#estate' },
  { label: 'Availability', href: '#availability' },
  { label: 'Progress', href: '#progress' },
  { label: 'Enquire', href: '#enquire' },
]

export default function SilverbrookPage() {
  const summary = useMemo(() => summarise(STANDS), [])

  // Always land at the top when navigating in from the portfolio.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="overflow-x-hidden">
      <Nav links={LINKS} cta={{ label: 'Enquire', href: '#enquire' }} />
      <main>
        <Hero />
        <Estate summary={summary} />
        <AvailabilityShowcase slug="silverbrook" name="Silverbrook Estate" />
        <ImageBreak />
        <Gallery />
        <HowItWorks />
        <Enquire />
      </main>
      <Footer links={FOOTER_LINKS} />
    </div>
  )
}
