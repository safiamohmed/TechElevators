"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function LoadingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] dark:bg-slate-800 text-center p-6 transition-all duration-500"
    >
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 text-2xl p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition"
        aria-label="Toggle Theme"
      >
        {theme === "dark" ? "🌞" : "🌙"}
      </button>

      <motion.h1
        className="text-4xl font-bold text-blue-400 mb-4"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        Loading the platform...⏳
      </motion.h1>

      <motion.p
        className="text-lg text-gray-600 dark:text-gray-300 mb-6"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        Just a moment and you’ll be inside the content 👀🚀
      </motion.p>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        <Image
          src={theme === "dark" ? "/loading-dark.gif" : "/loading-light.gif"}
          alt="Loading animation"
          width={200}
          height={200}
          className="mb-6"
        />
      </motion.div>
    </motion.div>
  );
}
