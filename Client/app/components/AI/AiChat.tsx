"use client";
import React, { FC, useState, useEffect, useRef } from "react";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { styles } from "@/app/styles/style";
import { ThemeSwitcher } from "@/app/utils/ThemeSwitcher";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";

type Props = {
  videoName: string;
};

interface Message {
  text: string;
  role: "user" | "bot";
  timestamp: Date;
}

interface ChatSession {
  sendMessage: (message: string) => Promise<any>;
}

const AiChat: FC<Props> = ({ videoName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [courseName, setCourseName] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  const MODEL_NAME = "gemini-1.0-pro-001";
  const API_KEY = "AIzaSyBTFD1gqjU7NPBnPX88RiFBC3kQSDVqy2c";
  const genAI = new GoogleGenerativeAI(API_KEY);

  const { id } = useParams() as { id: string };
  const router = useRouter();

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  // Scroll to bottom ref
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        const newChat: any = await genAI
          .getGenerativeModel({ model: MODEL_NAME })
          .startChat({
            generationConfig,
            safetySettings,
            history: messages.map((msg) => ({
              parts: [{ text: msg.text }],
              role: msg.role === "bot" ? "model" : msg.role,
            })),
          });
        setChat(newChat);
      } catch (err: any) {
        setErr("Something went wrong while starting the chat.");
      }
    };
    initChat();
  }, [transcript, courseName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    try {
      const userMessage: Message = {
        text: userInput.trim(),
        role: "user",
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setUserInput("");

      if (chat) {
        const trs = transcript
          ? `Use following Transcript if required NOT Compulsory - "${transcript}" and`
          : "and";

        const prompt = `QUESTION - ${userInput} Answer the following question and provide answer in context to concepts associated with ${videoName} or ${courseName} only. 
        ${trs}
        If question is out of context or not related to programming then just respond: "Please ask questions only related to ${videoName}".`;

        const result = await chat.sendMessage(prompt);
        const botMessage: Message = {
          text: result.response.text(),
          role: "bot",
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }
    } catch (err) {
      setErr("Something went wrong while sending your message.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGoToSummary = () => {
    router.push(`/summary?video=${encodeURIComponent(videoName)}`);
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-white dark:bg-gray-900">
      {/* الهيدر الجديد مع زر التلخيص و ايقونة تبديل الثيم */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-6 py-4 rounded-md shadow-md mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          ELearning AI BOT 🤖
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoToSummary}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-md shadow-md transition focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Go to summary page"
          >
            Summarize
          </button>
          <ThemeSwitcher />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-md p-4 bg-gray-50 dark:bg-gray-800 shadow-inner">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 mt-20">
            Start the conversation by typing your question below...
          </p>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 break-words block w-fit max-w-[75%] p-4 shadow-md rounded-3xl ${
              msg.role === "user"
                ? "ml-auto bg-blue-200 text-blue-900 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl max-w-[50%]"
                : "mr-auto bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-br-3xl rounded-tr-3xl rounded-tl-xl"
            }`}
            style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
          >
            <p className="whitespace-pre-wrap">{msg.text}</p>
            <span className="text-xs text-gray-300 dark:text-gray-400 mt-1 block text-right select-none">
              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {err && (
        <div className="text-red-500 text-sm mb-4 mt-2 text-center">
          {err}
        </div>
      )}

      <div className="flex items-center mt-4 border rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-400 bg-white dark:bg-gray-900">
        <input
          type="text"
          placeholder="Type your message..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-grow p-3 outline-none text-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-200 text-blue-900 px-6 py-3 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!userInput.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </div>

      {/* زر السهم الرجوع بدون صندوق */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={() => router.push(`/courses/`)}
          aria-label="Go back to course page"
          className="flex items-center space-x-2 text-blue-900 hover:text-blue-700 transition"
        >
          <IoArrowBack size={24} />
          <span className="font-medium text-lg">Back to Course</span>
        </button>
      </div>
    </div>
  );
};

export default AiChat;
