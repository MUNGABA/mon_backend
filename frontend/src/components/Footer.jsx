// FILE: src/components/Footer.jsx

import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-[#05070a] py-8">
      <div className="mx-auto max-w-6xl px-6 text-gray-400">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <img src="/images/logo-autour-de-la-bible.png" alt="logo" className="h-10 w-10 inline-block" />
            <span className="ml-3">Autour de la Bible</span>
          </div>
          <div className="text-sm">© {new Date().getFullYear()} Autour de la Bible — Tous droits réservés</div>
        </div>
        <div className="mt-6 text-sm text-gray-500">Contact : contact@autourdelaBible.example</div>
      </div>
    </footer>
  )
}
