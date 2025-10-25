// components/Toast.jsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Toast({ message, type = "success", duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className={`fixed bottom-5 right-5 z-50 px-4 py-2 rounded-lg text-white shadow-lg ${bgColor}`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
