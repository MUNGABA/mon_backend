// FILE: src/components/CompetitionsSection.jsx

import React from 'react'

const categories = [
  { title: 'Quiz biblique à buzzer', desc: 'Questions basées sur la Bible dans son intégralité.' },
]

export default function CompetitionsSection() {
  return (
        <section id="competition" 
         className="py-16 bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('/images/exemple.jpg')" }}
        >
        <div className="absolute inset-0 bg-black/60"></div> {/* ✅ Optionnel : ombre noire */}
        <div className="relative mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-bold text-white text-center">Autour de la bible</h2>
        <p className="mt-4 text-center text-gray-300">De la Genèse à l'Apocalypse, un défi de foi et de savoir</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((c) => (
            <div key={c.title} className="rounded-lg bg-[#0b2c3588] p-6">
              <h3 className="text-xl font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-gray-300 text-sm">{c.desc}</p>
              <a href="#inscription" className="mt-4 inline-block text-sm font-semibold text-indigo-400">S'inscrire →</a>
            </div>
          ))}
        </div>

        <div id="categories" className="mt-12">
          <h3 className="text-2xl font-bold text-white">Modalités</h3>
          <ul className="mt-4 list-disc pl-6 text-gray-300">
            <li>Inscription en ligne.</li>
            <li>Respect du règlement (voir page Règlement).</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
