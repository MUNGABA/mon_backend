// FILE: src/components/RulesSection.jsx
import React from 'react'

const rules = [
  "Respecter les autres participants.",
  "Avoir lu la Bible pour pouvoir répondre aux questions.",
  "Pas de triche pendant la compétition.",
  "Arriver à l'heure aux épreuves.",
  "Les décisions des arbitres sont finales."
]

export default function RulesSection() {
  return (
    <section id="rules" className="py-16 bg-[#0d1117]">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-3xl font-bold text-white text-center">Règlement de la compétition</h2>
        <p className="mt-2 text-center text-gray-300">Veuillez lire attentivement ces règles avant de vous inscrire.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {rules.map((rule, idx) => (
            <div
              key={idx}
              className="p-6 bg-[#0b2c3588] rounded-xl shadow-lg hover:bg-[#162938] transition cursor-pointer"
            >
              <span className="text-indigo-400 font-semibold mr-2">{idx + 1}.</span>
              <span className="text-gray-300">{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
