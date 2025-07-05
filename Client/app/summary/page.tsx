"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { ThemeSwitcher } from "@/app/utils/ThemeSwitcher";

const SummaryPage = () => {
  const searchParams = useSearchParams()!;
  const router = useRouter();

  const videoName = searchParams.get("video") ?? "Unknown Video";
  const courseName = searchParams.get("course") ?? "Unknown Course";
  const transcript = searchParams.get("transcript") ?? "";

  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const API_KEY = "AIzaSyBTFD1gqjU7NPBnPX88RiFBC3kQSDVqy2c";
  const genAI = new GoogleGenerativeAI(API_KEY);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setErr("");
      const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro-001" });

      const prompt = transcript
        ? `Summarize the following transcript in 5-7 lines, clearly and simply, in context of the course "${courseName}" and video "${videoName}":\n\n${transcript}`
        : `No transcript provided. Please generate a short 3-4 line summary of what the video "${videoName}" in course "${courseName}" might be about.`;

      const result = await model.generateContent(prompt);
      const text = await result.response.text();
      setSummary(text);
    } catch (error) {
      console.error(error);
      setErr("❌ Failed to generate summary.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("❌ Failed to copy.");
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">📄 Summary Page</h1>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <button
  onClick={() => router.back()}
  className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1 rounded"
>
  ← Back
</button>

          </div>
        </div>

        <p className="mb-2 text-gray-600 dark:text-gray-400">
          <strong>Course:</strong> {courseName}
        </p>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          <strong>Video:</strong> {videoName}
        </p>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "⏳ Generating..." : "✨ Generate Summary"}
        </button>

        {err && <p className="text-red-500">{err}</p>}

        {summary && (
          <>
            <div className="bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100 p-6 rounded-lg whitespace-pre-wrap mb-4 min-h-[200px]">
              {summary}
            </div>
            <button
              onClick={handleCopy}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              {copied ? "✅ Copied!" : "📋 Copy Summary"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SummaryPage;
