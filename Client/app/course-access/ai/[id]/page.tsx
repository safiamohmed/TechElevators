"use client";
import React, { useState } from "react";
import { styles } from "@/app/styles/style";
import Image from "next/image";
import AiChat from "@/app/components/AI/AiChat";
import { ThemeSwitcher } from "@/app/utils/ThemeSwitcher";

const Page = () => {
  const [videoName, setVideoName] = useState("");
  const [flag, setFlag] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (videoName.trim() !== "") {
      setFlag(true);
    }
  }

  return flag ? (
    <AiChat videoName={videoName} />
  ) : (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-lg flex justify-end mb-6">
        <ThemeSwitcher />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-lg w-full p-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Welcome to TechElevators
          <br />
          AI Bot
        </h1>

        <div className="flex justify-center mb-8">
          <Image
            src="/assests/AIBot.jpg"
            alt="AI Bot"
            width={180}
            height={140}
            className="rounded-md"
          />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <label
            htmlFor="video"
            className="text-lg font-medium text-gray-700 dark:text-gray-300"
          >
            Enter Name of the video
          </label>
          <input
            id="video"
            type="text"
            placeholder="Video Name"
            value={videoName}
            onChange={(e) => setVideoName(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md p-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            required
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md py-3 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Go To AI
          </button>
        </form>
      </div>
    </div>
  );
};

export default Page;
