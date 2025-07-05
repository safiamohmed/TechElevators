"use client";
import React, { FC, useState, MouseEventHandler, useRef, useEffect } from "react";
import { AiOutlineClose, AiOutlineSend, AiOutlineRobot } from "react-icons/ai";

const ChatAssistant: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { sender: "user" | "assistant"; text: string; time: string }[]
  >([]);
  const [showTopics, setShowTopics] = useState(true);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  const getTime = () =>
    new Date().toLocaleString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(/,/, "");

  const handleSendMessage: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    if (message.trim()) {
      const now = getTime();
      const response = generateResponse(message);
      setChatHistory((prev) => [
        ...prev,
        { sender: "user", text: message, time: now },
        { sender: "assistant", text: response, time: now },
      ]);
      setMessage("");
      setShowTopics(false);
    }
  };

  const handleTopicClick = (topicMessage: string) => {
    const now = getTime();
    const response = generateResponse(topicMessage);
    setChatHistory((prev) => [
      ...prev,
      { sender: "user", text: topicMessage, time: now },
      { sender: "assistant", text: response, time: now },
    ]);
    setShowTopics(false);
  };

  const generateResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase().trim();

    if (lowerMessage.includes("course") || lowerMessage.includes("courses") || lowerMessage.includes("available")) {
      return "You can explore available courses like Full Stack Web Development, Cybersecurity Essentials, and Frontend Development with DOM Mastery on the 'Courses' section.";
    } else if (lowerMessage.includes("faq") || lowerMessage.includes("where is the faq")) {
      return "Visit the 'FAQ' page from the sidebar to find answers to common questions!";
    } else if (lowerMessage.includes("help") || lowerMessage.includes("support") || lowerMessage.includes("get help")) {
      return "For support, use the Assistant chat or contact us via email at TechElevators.help@gmail.com.";
    } else if (lowerMessage.includes("blog") || lowerMessage.includes("posts") || lowerMessage.includes("read blog")) {
      return "Check the 'Blog' section for articles like 'Expand Your Career Opportunities With Python'.";
    } else if (lowerMessage.includes("profile") || lowerMessage.includes("account") || lowerMessage.includes("update profile")) {
      return "Access your profile by logging in to update your details or view your enrolled courses.";
    } else if (lowerMessage.includes("about") || lowerMessage.includes("platform") || lowerMessage.includes("techelevators")) {
      return "TechElevators is an e-learning platform designed to deliver personalized learning experiences using AI.";
    } else {
      return "I'm here to help! Please ask about courses, FAQ, blog, profile, support, or any other feature.";
    }
  };

  const recommendedTopics = [
    { text: "Explore Courses", message: "What courses are available?" },
    { text: "View FAQ", message: "Where is the FAQ?" },
    { text: "Update Profile", message: "How do I update my profile?" },
    { text: "Get Support", message: "How can I get help?" },
    { text: "Read Blog", message: "What blog posts are there?" },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-blue-600 transition dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <span className="text-2xl">🤖</span>
        </button>
      )}
      {isOpen && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-80 h-96 flex flex-col">
          <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">TechElevators Assistant</h3>
            <button onClick={() => setIsOpen(false)}>
              <AiOutlineClose className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100" size={20} />
            </button>
          </div>

          {showTopics && (
            <div className="p-2">
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Recommended Topics</h4>
              <div className="space-y-1">
                {recommendedTopics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => handleTopicClick(topic.message)}
                    className="w-full text-left p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    {topic.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`rounded-lg p-2 text-sm ${
                  msg.sender === "user"
                    ? "bg-blue-100 text-gray-900 self-end"
                    : "bg-gray-200 text-gray-800 flex items-center space-x-2"
                }`}
              >
                {msg.sender === "assistant" && <AiOutlineRobot size={18} className="text-blue-600" />}
                <div>
                  <p>{msg.text}</p>
                  <span className="block text-[10px] text-gray-500">{msg.time}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>

          {!showTopics && (
            <button
              onClick={() => setShowTopics(true)}
              className="text-xs text-blue-500 underline mb-1 self-start hover:text-blue-700"
            >
              Show Recommended Topics
            </button>
          )}

          <div className="border-t dark:border-gray-600 pt-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <AiOutlineSend size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
