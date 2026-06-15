import Nav, { type NavLink } from '../components/Nav'
import LandingHero from '../components/LandingHero'
import DevelopmentsShowcase from '../components/DevelopmentsShowcase'
import About from '../components/About'
import LandingContact from '../components/LandingContact'
import Footer from '../components/Footer'

const LINKS: NavLink[] = [
  { label: 'Developments', href: '#developments' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

const FOOTER_LINKS: NavLink[] = [
  { label: 'Developments', href: '#developments' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <Nav links={LINKS} cta={{ label: 'Enquire', href: '#contact' }} />
      <main>
        <LandingHero />
        <DevelopmentsShowcase />
        <About />
        <LandingContact />
      </main>
      <Footer links={FOOTER_LINKS} />
    </div>
  )
}
