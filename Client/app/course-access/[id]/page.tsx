"use client";

import CourseContent from "../../components/Course/CourseContent";
import Loader from "@/app/components/Loader/Loader";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";
import { useRouter } from "next/navigation";
import React, { useEffect, use } from "react"; // استدعاء use هنا

type Props = {
  params: Promise<{ id: string }>; // ✅ ده التعديل الأهم
};

const Page = ({ params }: Props) => {
  const { id } = use(params); // ✅ تفكيك الـ params باستخدام use
  const router = useRouter();
  const { isLoading, error, data } = useLoadUserQuery(undefined, {});
// ---------------------------------------------------------------
  useEffect(() => {
    if (data && data.user.role === "user") {
      if (data.price > 0) {
      const isPurchased = data.user.courses.find(
        (item: any) => item._id === id
      
      );
      if (!isPurchased) {
        router.push("/");
      }
    
    }
    if (error) {
      router.push("/");
    }}
  }, [data, error, id, router]);
  // -----------------------------------------------

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div>
          <CourseContent id={id} user={data?.user} />
        </div>
      )}
    </>
  );
};

export default Page;
