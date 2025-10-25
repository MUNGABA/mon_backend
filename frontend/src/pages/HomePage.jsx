// FILE: src/pages/HomePage.jsx

import React from 'react'
import Navbar from '../components/Nivbar'
import HeroSection from '../components/HeroSection'
import AboutSection from '../components/AboutSection'
import CompetitionsSection from '../components/CompetitionsSection'
import Footer from '../components/Footer'
import RulesSection from '../components/RulesSection'
import ContactSection from '../components/ContactSection'

export default function HomePage() {
  return (
    <div className="bg-[#0d1117] text-white font-sans min-h-screen">
      <Navbar />
      <main className="pt-24">
        <HeroSection />
        <CompetitionsSection />
        <RulesSection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}