import { styles } from "@/app/styles/style";
import {
  useEditLayoutMutation,
  useGetHeroDataQuery,
} from "@/redux/features/layout/layoutApi";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { AiOutlineDelete, AiOutlineCamera } from "react-icons/ai";
import { IoMdAddCircleOutline } from "react-icons/io";
import Loader from "../../Loader/Loader";

type Props = {};

const EditBlog = (props: Props) => {
  const { data, isLoading, refetch } = useGetHeroDataQuery("Blogs", {
    refetchOnMountOrArgChange: true,
  });
  const [editLayout, { isSuccess: layoutSuccess, error, isLoading: isUpdating }] =
    useEditLayoutMutation();
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    if (data?.layout?.blogs) {
      setBlogs(
        data.layout.blogs.map((blog: any) => ({
          ...blog,
          _id: blog._id || Math.random().toString(),
          image: blog.image?.url || "",
          category: blog.category || "",
          date: blog.date ? new Date(blog.date).toISOString().split("T")[0] : "", 
        }))
      );
    } else {
      setBlogs([]);
    }
    if (layoutSuccess) {
      toast.success("Blogs updated successfully");
      refetch();
    }
    if (error) {
      if ("data" in error) {
        const errorData = error as any;
        toast.error(errorData?.data?.message || "Failed to update Blogs");
      }
    }
  }, [data, layoutSuccess, error, refetch]);

  const handleBlogChange = (id: any, field: string, value: string) => {
    setBlogs((prevBlogs) =>
      prevBlogs.map((b) => (b._id === id ? { ...b, [field]: value } : b))
    );
  };

  const handleImageChange = (id: any, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (reader.readyState === 2) {
        setBlogs((prevBlogs) =>
          prevBlogs.map((b) =>
            b._id === id ? { ...b, image: e.target?.result as string } : b
          )
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const newBlogHandler = () => {
    setBlogs([
      ...blogs,
      {
        _id: Math.random().toString(),
        title: "",
        date: new Date().toISOString().split("T")[0], 
        author: "",
        comments: 0,
        content: "",
        image: "",
        category: "",
      },
    ]);
  };

  const deleteBlog = (id: any) => {
    setBlogs((prevBlogs) => prevBlogs.filter((b) => b._id !== id));
  };

  const areBlogsUnchanged = (originalBlogs: any[], newBlogs: any[]) => {
    return JSON.stringify(originalBlogs) === JSON.stringify(newBlogs);
  };

  const isAnyBlogEmpty = (blogs: any[]) => {
    return blogs.some(
      (b) => !b.title || !b.date || !b.author || !b.content || !b.image || !b.category
    );
  };

  const handleEdit = async () => {
    if (!areBlogsUnchanged(data?.layout?.blogs || [], blogs) && !isAnyBlogEmpty(blogs)) {
      await editLayout({
        type: "Blogs",
        blogs,
      });
    }
  };

  return (
    <div className="relative white dark:bg-gray-900 min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-4xl z-10">
        {isLoading || isUpdating ? (
          <Loader />
        ) : (
          <div className="w-[90%] 800px:w-[80%] m-auto mt-[120px]">
            <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">
              Edit Blogs
            </h1>
            <div className="space-y-4">
              {blogs.map((blog: any) => (
                <div
                  key={blog._id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4"
                >
                  <div className="relative mb-4">
                    {blog.image ? (
                      <img
                        src={
                          typeof blog.image === "string"
                            ? blog.image
                            : blog.image.url || "/assests/placeholder.jpg"
                        }
                        alt="Blog"
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/assests/placeholder.jpg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        No Image
                      </div>
                    )}
                    <input
                      type="file"
                      id={`image-${blog._id}`}
                      accept="image/*"
                      onChange={(e) => handleImageChange(blog._id, e.target.files![0])}
                      className="hidden"
                    />
                    <label
                      htmlFor={`image-${blog._id}`}
                      className="absolute bottom-2 right-2 bg-gray-800 text-white p-2 rounded-full cursor-pointer"
                    >
                      <AiOutlineCamera size={20} />
                    </label>
                  </div>
                  <input
                    className={`${styles.input} border-none text-gray-800 dark:text-gray-100 font-Poppins break-words mb-2`}
                    value={blog.title}
                    onChange={(e) => handleBlogChange(blog._id, "title", e.target.value)}
                    placeholder="Blog Title"
                  />
                  <input
                    type="date" // تغيير إلى type="date"
                    className={`${styles.input} border-none text-gray-800 dark:text-gray-100 font-Poppins break-words mb-2`}
                    value={blog.date}
                    onChange={(e) => handleBlogChange(blog._id, "date", e.target.value)}
                    placeholder="Blog Date"
                  />
                  <input
                    className={`${styles.input} border-none text-gray-800 dark:text-gray-100 font-Poppins break-words mb-2`}
                    value={blog.author}
                    onChange={(e) => handleBlogChange(blog._id, "author", e.target.value)}
                    placeholder="Author Name"
                  />
                  <input
                    className={`${styles.input} border-none text-gray-800 dark:text-gray-100 font-Poppins break-words mb-2`}
                    type="number"
                    value={blog.comments}
                    onChange={(e) => handleBlogChange(blog._id, "comments", e.target.value)}
                    placeholder="Number of Comments"
                  />
                  <textarea
                    className={`${styles.input} border-none text-gray-800 dark:text-gray-100 font-Poppins break-words mb-2`}
                    value={blog.content}
                    onChange={(e) => handleBlogChange(blog._id, "content", e.target.value)}
                    placeholder="Blog Content"
                    rows={4}
                  />
                  <input
                    className={`${styles.input} border-none text-gray-800 dark:text-gray-100 font-Poppins break-words mb-2`}
                    value={blog.category}
                    onChange={(e) => handleBlogChange(blog._id, "category", e.target.value)}
                    placeholder="Category (e.g., Python, Cybersecurity)"
                  />
                  <AiOutlineDelete
                    className="dark:text-white text-black text-[18px] cursor-pointer"
                    onClick={() => deleteBlog(blog._id)}
                  />
                </div>
              ))}
            </div>
            <br />
            <IoMdAddCircleOutline
              className="dark:text-white text-black text-[25px] cursor-pointer"
              onClick={newBlogHandler}
            />
            <div
              className={`${styles.button} !w-[100px] !min-h-[40px] !h-[40px] dark:text-white text-black bg-[#cccccc34] 
                ${
                  areBlogsUnchanged(data?.layout?.blogs || [], blogs) ||
                  isAnyBlogEmpty(blogs)
                    ? "!cursor-not-allowed"
                    : "!cursor-pointer !bg-[#42d383]"
                }
                !rounded fixed bottom-12 right-12`}
              onClick={
                areBlogsUnchanged(data?.layout?.blogs || [], blogs) ||
                isAnyBlogEmpty(blogs)
                  ? () => null
                  : handleEdit
              }
            >
              Save
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditBlog;