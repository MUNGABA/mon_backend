// FILE: src/components/Navbar.jsx

import React, { useState } from 'react'
import { Link } from 'react-router-dom' 

const navigation = [
  { name: 'Accueil', href: '#hero' },
  { name: 'Compétition', href: '#competition' },
  { name: 'Règlement', href: '#rules' },
  { name: 'Épreuves', href: '#categories' },
  { name: 'À propos', href: '#about' },
  { name: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <a href="#hero" className="flex items-center gap-3">
          <img src="/images/logo-autour-de-la-bible.png" alt="Autour de la Bible" className="h-10 w-10 object-contain" />
          <span className="text-white font-semibold">Autour de la Bible</span>
        </a>

        <nav className="hidden lg:flex lg:items-center lg:gap-6">
          {navigation.map((item) => (
            <a key={item.name} href={item.href} className="text-sm font-medium text-gray-200 hover:text-white">
              {item.name}
            </a>
          ))}
          <Link
                      to="/register" className="ml-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">S'inscrire</Link>
                       <Link
                      to="/login" className="ml-1 rounded-md bg-gray-800/80 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-500">Se connecter</Link>
        </nav>

        {/* Mobile */}
        <div className="lg:hidden">
          <button onClick={() => setOpen(!open)} className="inline-flex items-center justify-center rounded-md p-2.5 text-gray-200">
            <span className="sr-only">Open menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-[#0d1117] border-t border-white/5">
          <div className="px-6 py-4 space-y-2">
            {navigation.map((item) => (
              <a key={item.name} href={item.href} className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-white/5">
                {item.name}
              </a>
            ))}
            <a href="#inscription" className="block rounded-md bg-indigo-600 px-3 py-2 text-base font-semibold text-white hover:bg-indigo-500">S'inscrire</a>
          </div>
        </div>
      )}
    </header>
  )
}
