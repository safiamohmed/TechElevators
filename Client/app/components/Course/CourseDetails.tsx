import { styles } from "@/app/styles/style";
import CoursePlayer from "@/app/utils/CoursePlayer";
import Ratings from "@/app/utils/Ratings";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { IoCheckmarkDoneOutline, IoCloseOutline } from "react-icons/io5";
import { format } from "timeago.js";
import CourseContentList from "../Course/CourseContentList";
import { Elements } from "@stripe/react-stripe-js";
import CheckOutForm from "../Payment/CheckOutForm";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";
import Image from "next/image";
import { VscVerifiedFilled } from "react-icons/vsc";
import { useCreateOrderMutation } from "@/redux/features/orders/ordersApi";
import { toast } from "react-hot-toast";



type Props = {
  data: any;
  stripePromise: any;
  clientSecret: string;
  setRoute: any;
  setOpen: any;
};

const CourseDetails = ({
  data,
  stripePromise,
  clientSecret,
  setRoute,
  setOpen: openAuthModal,
}: Props) => {
  const { data: userData, refetch } = useLoadUserQuery(undefined, {});
  const [user, setUser] = useState<any>();
  const [open, setOpen] = useState(false);
    const [createOrder, { isLoading: isOrderLoading, error: orderError }] = useCreateOrderMutation();
  const [freeAccess, setFreeAccess] = useState(false); // ✅ جديد
  const [activeTab, setActiveTab] = useState("overview"); // Active tab state

  useEffect(() => {
    setUser(userData?.user);
  }, [userData]);

  const dicountPercentenge =
    ((data?.estimatedPrice - data.price) / data?.estimatedPrice) * 100;
  const discountPercentengePrice = dicountPercentenge.toFixed(0);

  const isPurchased =
    user && user?.courses?.find((item: any) => item._id === data._id);

  const handleOrder = (e: any) => {
    if (user) {
      setOpen(true);
    } else {
      setRoute("Login");
      openAuthModal(true);
    }
  };
   const handleGetFreeCourse = async () => {
    try {
      if (!user) {
        setRoute("Login");
        openAuthModal(true);
        return;
      }

      // استدعاء API create-order للكورس المجاني
      const response = await createOrder({
        courseId: data._id,
        payment_info: {
          id: `free_course_${Date.now()}`,
          status: "completed",
          type: "free",
        },
      }).unwrap();

      if (response.success) {
        setFreeAccess(true);
        refetch(); // تحديث بيانات المستخدم
        toast.success("Enrolled in free course successfully!");
      } else {
        throw new Error(response.message || "Failed to enroll in free course");
      }
    } catch (error: any) {
      console.error("Error enrolling in free course:", error);
      toast.error(error.message || "Failed to enroll in free course");
    }
  };

  return (
    <div>
      <div className="w-[90%] 800px:w-[90%] m-auto py-5">
        <div className="w-full flex flex-col-reverse 800px:flex-row">
          <div className="w-full 800px:w-[65%] 800px:pr-5">
            <h1 className="text-[25px] font-Poppins font-[600] text-black dark:text-white">
              {data.name}
            </h1>
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center">
                <Ratings rating={data.ratings} />
                <h5 className="text-black dark:text-white">
                  {data.reviews?.length} Reviews
                </h5>
              </div>
              <h5 className="text-black dark:text-white">
                {data.purchased} Students
              </h5>
            </div>
            <br />

            {/* Tabs */}
            <div className="tabs flex gap-3 mt-6">
              {["overview", "Course Content", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg font-Poppins font-medium transition-all duration-300
                    ${
                      activeTab === tab
    ? "bg-[#dc143c] text-white shadow-md" 
    : "bg-[#2563eb] text-white shadow-md"
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <br />
            <br />

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === "overview" && (
                <div className="space-y-6">
                 {/* What you will learn */}
                  <div className="p-4 bg-white dark:bg-slate-700 border rounded-xl shadow">
                    <h1 className="text-[25px] font-Poppins font-[600] text-black dark:text-white">
                      What you will learn from this course?
                    </h1>
                    {data.benefits?.length > 0 ? (
                      data.benefits.map((item: any, index: number) => (
                        <div
                          className="flex items-center py-2"
                          key={index}
                        >
                          <IoCheckmarkDoneOutline
                            size={20}
                            className="text-black dark:text-white"
                          />
                          <p className="pl-2 text-black dark:text-white">
                            {item.title}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-black dark:text-white">
                        No benefits available for this course.
                      </p>
                    )}
                  </div>

                  {/* Prerequisites */}
                  <div className="p-4 bg-white dark:bg-slate-700 border rounded-xl shadow">
                    <h1 className="text-[25px] font-Poppins font-[600] text-black dark:text-white">
                      What are the prerequisites for starting this course?
                    </h1>
                    {data.prerequisites?.length > 0 ? (
                      data.prerequisites.map((item: any, index: number) => (
                        <div
                          className="flex items-center py-2"
                          key={index}
                        >
                          <IoCheckmarkDoneOutline
                            size={20}
                            className="text-black dark:text-white"
                          />
                          <p className="pl-2 text-black dark:text-white">
                            {item.title}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-black dark:text-white">
                        No prerequisites required for this course.
                      </p>
                    )}
                  </div>

                  {/* Course Details */}
                  <div className="w-full bg-white dark:bg-slate-700 dark:bg-opacity-30 backdrop-blur border border-gray-200 dark:border-white/10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 flex flex-col justify-between">
                    <h1 className="text-[25px] font-Poppins font-[600] text-black dark:text-white">
                      Course Details
                    </h1>
                    <p className="text-[18px] mt-[20px] whitespace-pre-line w-full overflow-hidden text-black dark:text-white">
                      {data.description}
                    </p>
                  </div>
                </div>
              )}
              {/* ------------------------------------------------------- */}
              {activeTab === "Course Content" && (
                <div className="w-full bg-white dark:bg-slate-700 dark:bg-opacity-30 backdrop-blur border border-gray-200 dark:border-white/10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 flex flex-col justify-between">
                  <h1 className="text-[25px] font-Poppins font-[600] text-black dark:text-white mt-3">
                    Course Content
                  </h1>
<CourseContentList
  data={data?.courseData}
  isDemo={false}
  courseId={data._id}
/>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="w-full bg-white dark:bg-slate-700 dark:bg-opacity-30 backdrop-blur border border-gray-200 dark:border-white/10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 flex flex-col justify-between">
                  <h1 className="text-[25px] font-Poppins font-[600] text-black dark:text-white mb-4">
                    Reviews
                  </h1>
                  {(data?.reviews && [...data.reviews].reverse()).map((item: any, index: number) => (
                    <div className="w-full pb-4" key={index}>
                      <div className="flex">
                        <div className="w-[50px] h-[50px]">
                          <Image
                            src={
                              item.user.avatar
                                ? item.user.avatar.url
                                : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
                            }
                            width={50}
                            height={50}
                            alt=""
                            className="w-[50px] h-[50px] rounded-full object-cover"
                          />
                        </div>
                        <div className="pl-2">
                          <div className="flex items-center">
                            <h5 className="text-[18px] pr-2 text-black dark:text-white">
                              {item.user.name}
                            </h5>
                            <Ratings rating={item.rating} />
                          </div>
                          <p className="text-black dark:text-white">{item.review}</p>
                          <small className="text-[#000000d1] dark:text-[#ffffff83]">
                            {format(item.createdAt)} •
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* -------------------------------------------- */}
          {/* Right Sidebar */}
        <div className="w-full 800px:w-[35%] relative">
            <div className="sticky top-[0px] 800px:ml-6 z-50">
              <CoursePlayer videoUrl={data?.demoUrl} title={data?.title} />
              <div className="flex items-center pt-5">
                <h1 className="text-[25px] text-black dark:text-white">
                  {data.price === 0 ? "Free" : "$" + data.price}
                </h1>
                <h5 className="pl-3 text-[20px] mt-2 line-through text-black dark:text-white">
                  {data.estimatedPrice}$
                </h5>
                <h4 className="pl-5 pt-4 text-[22px] text-black dark:text-white">
                  {discountPercentengePrice}% Off
                </h4>
              </div>

              {/* ✅ Dynamic Button */}
              <div className="flex items-center">
                {isPurchased || user?.role === "admin" || freeAccess ? (
                  <Link
                    className={`${styles.button} !w-[180px] my-3 font-Poppins cursor-pointer !bg-[crimson]`}
                    href={`/course-access/${data._id}`}
                  >
                    Enter to Course
                  </Link>
                ) : data.price === 0 ? (
                  <div
                    className={`${styles.button} !w-[180px] my-3 font-Poppins cursor-pointer !bg-[crimson]`}
                    onClick={handleGetFreeCourse}
                  >
                    Get Course Free
                  </div>
                ) : (
                  <div
                    className={`${styles.button} !w-[180px] my-3 font-Poppins cursor-pointer !bg-[crimson]`}
                    onClick={handleOrder}
                  >
                    Buy Now {data.price}$
                  </div>
                )}
              </div>

              <br />
              <p className="pb-1 text-black dark:text-white">• Source code included</p>
              <p className="pb-1 text-black dark:text-white">• Full lifetime access</p>
              <p className="pb-1 text-black dark:text-white">• Certificate of completion</p>
              <p className="pb-3 800px:pb-1 text-black dark:text-white">• Premium Support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {open && (
        <div className="w-full h-screen bg-[#00000036] fixed top-0 left-0 z-50 flex items-center justify-center">
          <div className="w-[500px] min-h-[500px] bg-white rounded-xl shadow p-3">
            <div className="w-full flex justify-end">
              <IoCloseOutline
                size={40}
                className="text-black cursor-pointer"
                onClick={() => setOpen(false)}
              />
            </div>
            <div className="w-full">
              {stripePromise && clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckOutForm setOpen={setOpen} data={data} user={user} refetch={refetch} />
                </Elements>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetails;
