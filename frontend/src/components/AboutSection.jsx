// FILE: src/components/AboutSection.jsx

import React from 'react'

export default function AboutSection() {
  return (
    <section id="about" className="py-16 bg-[#071021]">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-3xl font-bold text-white">À propos — Pourquoi « Autour de la Bible » ?</h2>
        <p className="mt-4 text-gray-300">Notre compétition célèbre la connaissance et l’amour de la Bible. Elle vise à encourager l’étude, la mémoire et le partage des enseignements bibliques dans un esprit de respect et fraternité.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-lg bg-gradient-to-br from-white/5 to-white/2 p-6">
            <h3 className="text-xl font-semibold text-white">Éducation</h3>
            <p className="mt-2 text-gray-300 text-sm">Approfondir la connaissance biblique.</p>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-white/5 to-white/2 p-6">
            <h3 className="text-xl font-semibold text-white">Communauté</h3>
            <p className="mt-2 text-gray-300 text-sm">Rencontrer d'autres passionnés.</p>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-white/5 to-white/2 p-6">
            <h3 className="text-xl font-semibold text-white">Récompenses</h3>
            <p className="mt-2 text-gray-300 text-sm">Des prix symboliques et spirituels.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
