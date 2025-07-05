// ✅ CourseInformation.tsx - thumbnail تدعم File بدل ما تكون string فقط
/* eslint-disable @next/next/no-img-element */
import { styles } from "@/app/styles/style";
import React, { FC, useState } from "react";

type Props = {
  courseInfo: {
    name: string;
    description: string;
    price: string;
    estimatedPrice: string;
    tags: string;
    level: string;
    categories: string;
    demoUrl: string;
    thumbnail: string | File;
  };
  setCourseInfo: (courseInfo: any) => void;
  active: number;
  setActive: (active: number) => void;
};

const CourseInformation: FC<Props> = ({
  courseInfo,
  setCourseInfo,
  active,
  setActive,
}) => {
  const [dragging, setDragging] = useState(false);

  const categories = [
    { title: "ES", _id: 1 },
    { title: "Backend", _id: 2 },
  ];

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setActive(active + 1);
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      setCourseInfo({ ...courseInfo, thumbnail: file });
    }
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: any) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setCourseInfo({ ...courseInfo, thumbnail: file });
    }
  };

  return (
    <div className="w-[80%] m-auto mt-24">
      <form onSubmit={handleSubmit} className={`${styles.label}`}>
        <div>
          <label>Course Name</label>
          <input
            type="text"
            required
            value={courseInfo.name}
            onChange={(e) =>
              setCourseInfo({ ...courseInfo, name: e.target.value })
            }
            placeholder="MERN stack LMS platform with next 13"
            className={styles.input}
          />
        </div>
        <br />
        <div className="mb-5">
          <label>Course Description</label>
          <textarea
            rows={8}
            placeholder="Write something amazing..."
            className={`${styles.input} !h-min !py-2`}
            value={courseInfo.description}
            onChange={(e) =>
              setCourseInfo({ ...courseInfo, description: e.target.value })
            }
          ></textarea>
        </div>
        <br />
        <div className="w-full flex justify-between">
          <div className="w-[45%]">
            <label>Course Price</label>
            <input
              type="number"
              required
              value={courseInfo.price}
              onChange={(e) =>
                setCourseInfo({ ...courseInfo, price: e.target.value })
              }
              placeholder="29"
              className={styles.input}
            />
          </div>
          <div className="w-[50%]">
            <label>Estimated Price (optional)</label>
            <input
              type="number"
              value={courseInfo.estimatedPrice}
              onChange={(e) =>
                setCourseInfo({
                  ...courseInfo,
                  estimatedPrice: e.target.value,
                })
              }
              placeholder="79"
              className={styles.input}
            />
          </div>
        </div>
        <br />
        <div className="w-full flex justify-between">
          <div className="w-[45%]">
            <label>Course Tags</label>
            <input
              type="text"
              required
              value={courseInfo.tags}
              onChange={(e) =>
                setCourseInfo({ ...courseInfo, tags: e.target.value })
              }
              placeholder="MERN,Next 13,Socket io,tailwind css,LMS"
              className={styles.input}
            />
          </div>
          <div className="w-[50%]">
            <label>Course Categories</label>
            <select
              value={courseInfo.categories}
              onChange={(e) =>
                setCourseInfo({ ...courseInfo, categories: e.target.value })
              }
              className={styles.input}
            >
              <option value="">Select Category</option>
              {categories.map((item) => (
                <option value={item.title} key={item._id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <br />
        <div className="w-full flex justify-between">
          <div className="w-[45%]">
            <label>Course Level</label>
            <input
              type="text"
              required
              value={courseInfo.level}
              onChange={(e) =>
                setCourseInfo({ ...courseInfo, level: e.target.value })
              }
              placeholder="Beginner/Intermediate/Expert"
              className={styles.input}
            />
          </div>
          <div className="w-[50%]">
            <label>Demo Url</label>
            <input
              type="text"
              required
              value={courseInfo.demoUrl}
              onChange={(e) =>
                setCourseInfo({ ...courseInfo, demoUrl: e.target.value })
              }
              placeholder="eer74fd"
              className={styles.input}
            />
          </div>
        </div>
        <br />
        <div className="w-full">
          <input
            type="file"
            accept="image/*"
            id="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="file"
            className={`w-full min-h-[10vh] border p-3 border-dashed flex items-center justify-center ${
              dragging ? "bg-blue-500" : "bg-transparent"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {courseInfo.thumbnail instanceof File ? (
              <span className="text-black dark:text-white">
                {courseInfo.thumbnail.name}
              </span>
            ) : (
              <span className="text-black dark:text-white">
                Drag and drop your thumbnail here or click to browse
              </span>
            )}
          </label>
        </div>
        <br />
        <div className="w-full flex items-center justify-end">
          <input
            type="submit"
            value="Next"
            className="w-full 800px:w-[180px] h-[40px] bg-[#37a39a] text-white rounded mt-8 cursor-pointer"
          />
        </div>
        <br />
      </form>
    </div>
  );
};

export default CourseInformation;
