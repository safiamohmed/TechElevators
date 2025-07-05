import Ratings from "@/app/utils/Ratings";
import Image from "next/image";
import Link from "next/link";
import React, { FC } from "react";
import { AiOutlineUnorderedList } from "react-icons/ai";
import cybersecurity from "@/public/assests/cybersecurity.jpg"; // Ensure this path is correct

type Props = {
  item: any;
  isProfile?: boolean;
};

const CourseCard: FC<Props> = ({ item, isProfile }) => {
  // Fallback to cybersecurity image if thumbnail is missing
  const thumbnailUrl = item?.thumbnail?.url || cybersecurity;
  
  return (
    <Link
      href={!isProfile ? `/course/${item._id}` : `course-access/${item._id}`}
    >
      <div className="w-full min-h-[420px] bg-white dark:bg-slate-700 dark:bg-opacity-30 backdrop-blur border border-gray-200 dark:border-white/10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 flex flex-col justify-between">
        {/* الصورة */}
        <div className="w-full h-[200px] relative rounded-md overflow-hidden">
          
          <Image
            src={thumbnailUrl}
            alt={item.name || "Course thumbnail"}
            fill
            className="object-cover"
          />
        </div>

        <h1 className="font-Poppins text-[16px] text-black dark:text-white pt-3 line-clamp-2 font-medium">
          {item.name}
        </h1>

        <div className="w-full flex items-center justify-between mt-2">
          <Ratings rating={item.ratings || 0} />
          <h5
            className={`text-sm text-gray-700 dark:text-gray-300 ${
              isProfile && "hidden 800px:inline"
            }`}
          >
            {item.purchased || 0} Students
          </h5>
        </div>

        <div className="w-full flex items-center justify-between mt-3">
          <div className="flex items-end">
            <h3 className="text-black dark:text-white text-[15px] font-semibold">
              {item.price === 0 ? "Free" : `$${item.price}`}
            </h3>
            <h5 className="pl-2 text-[13px] line-through text-gray-500 dark:text-gray-400">
              ${item.estimatedPrice}
            </h5>
          </div>

          <div className="flex items-center">
            <AiOutlineUnorderedList
              size={18}
              className="text-blue-500 dark:text-blue-400"
            />
            <h5 className="pl-1 text-black dark:text-white text-[14px]">
              {item.courseData?.length || 0} Lectures
            </h5>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
