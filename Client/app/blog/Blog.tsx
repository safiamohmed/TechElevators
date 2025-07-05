"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Calendar, MessageCircle, User, Folder } from "lucide-react";
import { useTheme } from "next-themes";
import { useGetHeroDataQuery } from "@/redux/features/layout/layoutApi";

const categories = ["Python", "Cybersecurity", "Web Development", "DevOps", "Cloud Computing"];

const Blog = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data, isLoading } = useGetHeroDataQuery("Blogs", {
    refetchOnMountOrArgChange: true,
  });

  const articles = data?.layout?.blogs || [];

  // Log articles for debugging
  console.log("Articles:", articles);

  // Convert dates to "Month Year" format
  const uniqueDates: string[] = Array.from(
    new Set<string>(
      articles
        .filter((article: any) => article.date && !isNaN(new Date(article.date).getTime())) // Filter valid dates
        .map((article: any): string => {
          const date = new Date(article.date);
          return `${date.toLocaleString("en-EG", { month: "long" })} ${date.getFullYear()}`;
        })
    )
  ).sort((a, b) => {
    const [monthA, yearA] = a.split(" ");
    const [monthB, yearB] = b.split(" ");
    return (
      Number(yearB) - Number(yearA) ||
      new Date(`1 ${monthB} 2000`).getMonth() - new Date(`1 ${monthA} 2000`).getMonth()
    );
  });

  const uniqueCateg: string[] = Array.from(
    new Set(articles.map((article: any) => article.category || "No Categories"))
  );

  // Filter articles based on search, category, and date
  const filteredArticles = articles.filter((article: any) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    const articleDate = new Date(article.date || "1970-01-01");
    const formattedArticleDate = `${articleDate.toLocaleString("en-EG", { month: "long" })} ${articleDate.getFullYear()}`;
    const matchesDate = !selectedDate || formattedArticleDate === selectedDate;
    return matchesSearch && matchesCategory && matchesDate;
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Function to show all categories
  const handleShowAllCategories = () => {
    setSelectedCategory(null);
  };

  // Function to show all dates
  const handleShowAllDates = () => {
    setSelectedDate(null);
  };

  return (
    <div className="relative text-black dark:text-white min-h-screen flex items-center justify-center px-4 overflow-hidden py-10">
      <div className="container mx-auto px-4">
        <h1
          className={`text-5xl font-extrabold mb-8 text-center tracking-wide 
          ${theme === "dark" ? "text-gradient drop-shadow-lg" : "text-gradient drop-shadow-md"}`}
        >
          BLOGS
        </h1>

        <div className="block md:hidden p-4">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none bg-white dark:bg-gray-800 text-black dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Article list */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
            {filteredArticles.map((article: any) => {
              const summary =
                article.content?.length > 50
                  ? `${article.content.slice(0, 50)}...`
                  : article.content || "No content";

              return (
                <div
                  key={article._id}
                  className="flex flex-col justify-between h-full p-6 rounded-lg shadow-lg bg-white dark:bg-gray-800"
                >
                  <div>
                    <div className="w-full h-[250px] overflow-hidden rounded-lg">
                      <Image
                        src={article.image?.url || "/assests/placeholder.jpg"}
                        alt="Blog"
                        width={500}
                        height={250}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex items-center text-gray-500 text-sm md:text-sm mt-4 space-x-4 justify-center">
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" /> {article.author}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" /> {new Date(article.date).toLocaleDateString("en-EG")}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1" /> Comments
                      </span>
                    </div>

                    <h2 className="text-2xl font-semibold mt-4 text-center">{article.title}</h2>

                    <p className="text-gray-600 mt-2 text-center">{summary}</p>
                  </div>

                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => router.push(`/blog/${article._id}`)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-6 rounded-md hover:bg-blue-600 transition"
                    >
                      Read More
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div>
            <div className="p-4 rounded-lg shadow-lg dark:bg-gray-800 hidden md:block">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none bg-white dark:bg-gray-800 text-black dark:text-white"
              />
            </div>

            <div className="p-4 rounded-lg shadow-lg white dark:bg-gray-800 mt-4">
              <h3 className="text-lg font-semibold mb-3">Recent Posts</h3>
              <ul className="space-y-3">
                {articles.slice(0, 5).map((article: any) => (
                  <li
                    key={article._id}
                    className="cursor-pointer hover:underline text-blue-500"
                    onClick={() => router.push(`/blog/${article._id}`)}
                  >
                    {article.title}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-lg shadow-lg white dark:bg-gray-800 mt-4">
              <h3 className="text-lg font-semibold mb-3">Archive</h3>
              <ul className="space-y-3">
                <li
                  className={`cursor-pointer hover:underline ${
                    selectedDate === null ? "text-blue-600 font-bold" : "text-blue-500"
                  }`}
                  onClick={handleShowAllDates}
                >
                  <Calendar className="w-4 h-4 inline-block mr-2" />
                  Show All
                </li>
                {uniqueDates.map((date, index) => (
                  <li
                    key={index}
                    className={`cursor-pointer hover:underline ${
                      selectedDate === date ? "text-blue-600 font-bold" : "text-blue-500"
                    }`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <Calendar className="w-4 h-4 inline-block mr-2" />
                    {date} ({articles.filter((article: any) => {
                      const articleDate = new Date(article.date || "1970-01-01");
                      return `${articleDate.toLocaleString("en-EG", { month: "long" })} ${articleDate.getFullYear()}` === date;
                    }).length})
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-lg shadow-lg white dark:bg-gray-800 mt-4">
              <h3 className="text-lg font-semibold mb-3">Categories</h3>
              <ul className="space-y-3">
                <li
                  className={`cursor-pointer hover:underline ${
                    selectedCategory === null ? "text-blue-600 font-bold" : "text-blue-500"
                  }`}
                  onClick={handleShowAllCategories}
                >
                  <Folder className="w-4 h-4 inline-block mr-2" />
                  Show All
                </li>
                {uniqueCateg.map((category, index) => (
                  <li
                    key={index}
                    className={`cursor-pointer hover:underline ${
                      selectedCategory === category ? "text-blue-600 font-bold" : "text-blue-500"
                    }`}
                    onClick={() => {
                      setSelectedCategory(selectedCategory === category ? null : category);
                    }}
                  >
                    <Folder className="w-4 h-4 inline-block mr-2" />
                    {category}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;