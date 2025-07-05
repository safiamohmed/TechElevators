"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useGetHeroDataQuery } from "@/redux/features/layout/layoutApi";

const BlogPost = () => {
  const params = useParams();
  const id = params?.id ? params.id as string : null;
  const { data } = useGetHeroDataQuery("Blogs", {
    refetchOnMountOrArgChange: true,
  });
  const article = data?.layout?.blogs.find((article: any) => article._id === id);

  const [comments, setComments] = useState(["Great article!", "Very informative."]);
  const [newComment, setNewComment] = useState("");
  const { theme } = useTheme();

  if (!article) return <p className="text-center text-xl mt-10">Article not found</p>;

  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      setComments([...comments, newComment]);
      setNewComment("");
    }
  };

  return (
    <div
      className={`min-h-screen py-10 flex justify-center ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div
        className={`max-w-3xl w-full shadow-lg rounded-lg p-6 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h1 className="text-4xl font-bold text-center mb-6">{article.title}</h1>
        <div className="w-full overflow-hidden rounded-lg">
          <Image
            src={article.image?.url || "/assests/placeholder.jpg"}
            width={600}
            height={350}
            alt="Blog"
            className="rounded-lg object-cover w-full h-64"
          />
        </div>
        <div
          className={`text-sm mt-4 flex justify-between ${
            theme === "dark" ? "text-gray-300" : "text-gray-500"
          }`}
        >
          <span>By {article.author}</span>
          <span>{new Date(article.date).toLocaleDateString("en-EG")}</span>
        </div>
        <p
          className={`mt-4 text-lg ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {article.content}
        </p>
        <div className="mt-10">
          <h3 className="text-2xl font-semibold">Comments ({comments.length})</h3>
          <div
            className={`mt-4 p-4 rounded-lg shadow-inner ${
              theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-50 text-gray-800"
            }`}
          >
            {comments.length > 0 ? (
              <ul>
                {comments.map((comment, index) => (
                  <li
                    key={index}
                    className={`border-b py-2 ${
                      theme === "dark" ? "border-gray-600 text-white" : "border-gray-200 text-gray-800"
                    }`}
                  >
                    {comment}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No comments yet.</p>
            )}
          </div>
          <div className="mt-4">
            <textarea
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${
                theme === "dark"
                  ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-400"
                  : "bg-gray-100 text-black border-gray-300 focus:ring-blue-500"
              }`}
              rows={3}
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            ></textarea>
             <button 
                          onClick={handleCommentSubmit} 
                          className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:bg-blue-600 rounded-lg transition"
                        >
                          Post Comment
                        </button>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;