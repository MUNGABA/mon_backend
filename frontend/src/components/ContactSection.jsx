// FILE: src/components/ContactSection.jsx
import React, { useState } from 'react'
import { FaFacebook, FaInstagram, FaTwitter, FaEnvelope } from 'react-icons/fa'

export default function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    alert(`Merci ${formData.name}, votre message a été envoyé !`)
    setFormData({ name: '', email: '', message: '' })
  }

  return (
    <section id="contact" className="py-16 bg-[#0d1117]">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-3xl font-bold text-white text-center">Contactez-nous</h2>
        <p className="mt-2 text-center text-gray-300">Pour toute question, utilisez le formulaire ou nos réseaux sociaux.</p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="mt-8 grid gap-6 bg-[#0b2c3588] p-8 rounded-xl shadow-lg">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Votre nom"
            className="w-full rounded-md bg-[#162938] px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Votre email"
            className="w-full rounded-md bg-[#162938] px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Votre message"
            rows="5"
            className="w-full rounded-md bg-[#162938] px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-500 transition"
          >
            Envoyer
          </button>
        </form>

        {/* Réseaux sociaux */}
        <div className="mt-8 flex justify-center gap-6 text-white text-2xl">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition"><FaFacebook /></a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition"><FaInstagram /></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition"><FaTwitter /></a>
          <a href="mailto:contact@example.com" className="hover:text-green-400 transition"><FaEnvelope /></a>
        </div>
      </div>
    </section>
  )
}
