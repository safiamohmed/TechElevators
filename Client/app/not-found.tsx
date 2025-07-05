"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] dark:bg-slate-800 text-center p-6 transition-all duration-500">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 text-2xl p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition"
        aria-label="Toggle Theme"
      >
        {theme === "dark" ? "🌞" : "🌙"}
      </button>

  

      <Image
        src={theme === "dark" ? "/oops-404.png" : "/oops-404.png"}
        alt="Error Illustration"
        width={600}
        height={600}
        className="mb-6"
      />

      <button
        onClick={() => router.push("/")}
        className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-3 rounded-xl shadow-lg transition"
      >
        Back to Home Page
      </button>
    </div>
  );
}
