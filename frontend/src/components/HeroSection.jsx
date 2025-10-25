// FILE: src/components/HeroSection.jsx

import React from 'react'
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa'
import { Link } from 'react-router-dom' // 🔹 Pour utiliser les routes

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/bible-open.jpg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>

      {/* Contenu */}
      <div className="relative z-10 mx-auto max-w-4xl py-32 px-6 text-center">
        {/* Bouton se connecter en haut à droite */}
        <div className="absolute top-6 right-6">
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight text-white">
          Autour de la Bible
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-300">
          Participez à la plus belle compétition de connaissances bibliques — testez, partagez et célébrez la Parole.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            Participer maintenant
          </Link>
          <a href="#competition" className="text-sm font-medium text-gray-200">
            En savoir plus →
          </a>
        </div>

        {/* Stats */}
        <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-300">
          <div>
            <div className="text-2xl font-bold">+5 000</div>
            <div className="text-xs">Participants (estimés)</div>
          </div>
          <div>
            <div className="text-2xl font-bold">🏆</div>
            <div className="text-xs">Récompenses</div>
          </div>
          <div>
            <div className="text-2xl font-bold">2025</div>
            <div className="text-xs">Édition</div>
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="mt-12 flex items-center justify-center gap-6 text-white text-2xl">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition">
            <FaFacebook />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition">
            <FaInstagram />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition">
            <FaTwitter />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition">
            <FaYoutube />
          </a>
        </div>
      </div>
    </section>
  )
}
