import React, { FC } from "react";
import CoursePlayer from "../../../utils/CoursePlayer";
import { styles } from "../../../../app/styles/style";
import Ratings from "../../../../app/utils/Ratings";
import { IoCheckmarkDoneOutline } from "react-icons/io5";

type Props = {
  active: number;
  setActive: (active: number) => void;
  courseData: any;
  handleCourseCreate: any;
  isEdit?: boolean;
};

const CoursePreview: FC<Props> = ({
  courseData,
  handleCourseCreate,
  setActive,
  active,
  isEdit,
}) => {
  const discountPercentenge =
    ((courseData?.estimatedPrice - courseData?.price) / courseData?.estimatedPrice) * 100;

  const discountPercentengePrice = discountPercentenge.toFixed(0);

  const prevButton = () => setActive(active - 1);
  const createCourse = () => handleCourseCreate();

  return (
    <div className="w-[90%] m-auto py-5 mb-5 dark:text-white">
      <div className="w-full relative">
        <div className="w-full mt-10">
          <CoursePlayer
            videoUrl={courseData?.demoUrl}
            title={courseData?.name}
          />
        </div>

        <div className="flex items-center">
          <h1 className="pt-5 text-[25px] dark:text-white">
            {courseData?.price === 0 ? "Free" : courseData?.price + "$"}
          </h1>
          <h5 className="pl-3 text-[20px] mt-2 line-through opacity-80 dark:text-gray-300">
            {courseData?.estimatedPrice}$
          </h5>
          <h4 className="pl-5 pt-4 text-[22px] dark:text-white">
            {discountPercentengePrice}% Off
          </h4>
        </div>

        <div className="flex items-center">
          <div
            className={`${styles.button} !w-[180px] my-3 font-Poppins !bg-[crimson] cursor-not-allowed`}
          >
            Buy Now {courseData?.price}$
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="text"
            placeholder="Discount code..."
            className={`${styles.input} 1500px:!w-[50%] 1100px:w-[60%] ml-3 !mt-0 dark:bg-gray-800 dark:text-white`}
          />
          <div
            className={`${styles.button} !w-[120px] my-3 ml-4 font-Poppins cursor-pointer`}
          >
            Apply
          </div>
        </div>

        <p className="pb-1 dark:text-white">• Source code included</p>
        <p className="pb-1 dark:text-white">• Full lifetime access</p>
        <p className="pb-1 dark:text-white">• Certificate of completion</p>
        <p className="pb-3 800px:pb-1 dark:text-white">• Premium Support</p>

        {courseData?.thumbnail && (typeof courseData.thumbnail === "string" || courseData.thumbnail.name) && (
          <p className="pb-1 dark:text-white">
            • Thumbnail: {typeof courseData.thumbnail === "string" ? courseData.thumbnail : courseData.thumbnail.name}
          </p>
        )}
      </div>

      <div className="w-full">
        <div className="w-full 800px:pr-5">
          <h1 className="text-[25px] font-Poppins font-[600] dark:text-white">
            {courseData?.name}
          </h1>
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center">
              <Ratings rating={0} />
              <h5 className="dark:text-white">0 Reviews</h5>
            </div>
            <h5 className="dark:text-white">0 Students</h5>
          </div>

          <br />
          <h1 className="text-[25px] font-Poppins font-[600] dark:text-white">
            What you will learn from this course?
          </h1>
        </div>

        {courseData?.benefits?.map((item: any, index: number) => (
          <div className="w-full flex 800px:items-center py-2" key={index}>
            <div className="w-[15px] mr-1 text-blue-500">
              <IoCheckmarkDoneOutline size={20} />
            </div>
            <p className="pl-2 dark:text-white">{item.title}</p>
          </div>
        ))}

        <br />
        <br />
        <h1 className="text-[25px] font-Poppins font-[600] dark:text-white">
          What are the prerequisites for starting this course?
        </h1>
        {courseData?.prerequisites?.map((item: any, index: number) => (
          <div className="w-full flex 800px:items-center py-2" key={index}>
            <div className="w-[15px] mr-1 text-blue-500">
              <IoCheckmarkDoneOutline size={20} />
            </div>
            <p className="pl-2 dark:text-white">{item.title}</p>
          </div>
        ))}

        <br />
        <br />
        <div className="w-full">
          <h1 className="text-[25px] font-Poppins font-[600] dark:text-white">
            Course Details
          </h1>
          <p className="text-[18px] mt-[20px] whitespace-pre-line w-full overflow-hidden dark:text-gray-200">
            {courseData?.description}
          </p>
        </div>

        <br />
        <br />
      </div>

      <div className="w-full flex items-center justify-between">
        <div
          className="w-full 800px:w-[180px] flex items-center justify-center h-[40px] bg-[#37a39a] text-center text-[#fff] rounded mt-8 cursor-pointer"
          onClick={prevButton}
        >
          Prev
        </div>
        <div
          className="w-full 800px:w-[180px] flex items-center justify-center h-[40px] bg-[#37a39a] text-center text-[#fff] rounded mt-8 cursor-pointer"
          onClick={createCourse}
        >
          {isEdit ? "Update" : "Create"}
        </div>
      </div>
    </div>
  );
};

export default CoursePreview;