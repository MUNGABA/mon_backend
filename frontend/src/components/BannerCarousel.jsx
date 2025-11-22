// src/components/BannerCarousel.jsx
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function BannerCarousel({ banners = [], interval = 7000 }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  // Démarrer / reset timer
  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      handleNext();
    }, interval);
  };

  useEffect(() => {
    if (banners.length === 0) return;
    setIndex(0); // Reset à la première bannière quand la liste change
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [banners, interval]);

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % banners.length);
    startTimer();
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + banners.length) % banners.length);
    startTimer();
  };

  if (banners.length === 0) {
    return <p className="text-gray-500 text-sm">Aucune bannière disponible.</p>;
  }

  const optimizeImage = (url, width = 600) => {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
  };


  return (
    <div className="relative w-full h-64 md:h-64 lg:h-72 overflow-hidden rounded-2xl shadow-lg">
      {/* Bande horizontale panoramique */}
      <motion.div
        className="flex w-full h-full"
        animate={{ x: `-${index * 100}%` }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {banners.map((b) => (
          <img
            key={b.id}
            src={optimizeImage(b.image, 1000)}
            alt="bannière"
            className="w-full h-full object-cover flex-shrink-0"
          />
        ))}
      </motion.div>

      {/* ⬅️ ➡️ contrôles */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2 py-1 rounded hover:bg-black/70 transition"
      >
        ⬅
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2 py-1 rounded hover:bg-black/70 transition"
      >
        ➡
      </button>

      {/* ⚪ indicateurs */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {banners.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i === index ? "bg-white" : "bg-gray-400/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
