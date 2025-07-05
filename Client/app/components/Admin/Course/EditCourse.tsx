"use client";
import React, { FC, useEffect, useState } from "react";
import CourseInformation from "./CourseInformation";
import CourseOptions from "./CourseOptions";
import CourseData from "./CourseData";
import CourseContent from "./CourseContent";
import CoursePreview from "./CoursePreview";
import { useEditCourseMutation, useGetAllCoursesQuery } from "../../../../redux/features/courses/coursesApi";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
};

const EditCourse: FC<Props> = ({ id }) => {
  const router = useRouter();
  const [editCourse, { isSuccess, error }] = useEditCourseMutation();
  const { data: allCoursesData, refetch } = useGetAllCoursesQuery({});
  const editCourseData = allCoursesData?.courses?.find((i: any) => i._id === id);

  const [active, setActive] = useState(0);
  const [courseInfo, setCourseInfo] = useState({
    name: "",
    description: "",
    price: "",
    estimatedPrice: "",
    tags: "",
    level: "",
    categories: "",
    demoUrl: "",
    thumbnail: null as File | null | string,
  });
  const [benefits, setBenefits] = useState([{ title: "" }]);
  const [prerequisites, setPrerequisites] = useState([{ title: "" }]);
  const [courseContentData, setCourseContentData] = useState<any[]>([]);
  const [videosToDelete, setVideosToDelete] = useState<string[]>([]);

  useEffect(() => {
    if (editCourseData) {
      setCourseInfo({
        name: editCourseData.name || "",
        description: editCourseData.description || "",
        price: editCourseData.price || "",
        estimatedPrice: editCourseData.estimatedPrice || "",
        tags: editCourseData.tags || "",
        level: editCourseData.level || "",
        categories: editCourseData.categories || "",
        demoUrl: editCourseData.demoUrl || "",
        thumbnail: editCourseData.thumbnail?.url || null,
      });
      setBenefits(editCourseData.benefits || [{ title: "" }]);
      setPrerequisites(editCourseData.prerequisites || [{ title: "" }]);
      setCourseContentData(
        editCourseData.courseData?.map((content: any) => ({
          videoUrl: content.videoUrl || "",
          videoFile: null,
          title: content.title || "",
          description: content.description || "",
          videoSection: content.videoSection || "Untitled Section",
          videoLength: content.videoLength || "",
          links: content.links || [{ title: "", url: "" }],
          suggestion: content.suggestion || "",
          _id: content._id || "",
        })) || []
      );
    }
  }, [editCourseData]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Course updated successfully");
      refetch().then(() => {
        setTimeout(() => {
          router.push("/admin/courses");
        }, 1000);
      });
    }
    if (error && "data" in error) {
      toast.error((error as any).data?.message || "Error occurred");
    }
  }, [isSuccess, error, refetch, router]);

  const handleSubmit = async () => {
    const formData = new FormData();
    const formattedBenefits = benefits.map((benefit) => ({ title: benefit.title }));
    const formattedPrerequisites = prerequisites.map((prerequisite) => ({ title: prerequisite.title }));
    console.log("Formatted Benefits:", formattedBenefits); // للتحقق
    console.log("Formatted Prerequisites:", formattedPrerequisites); // للتحقق


    formData.append("name", courseInfo.name);
    formData.append("description", courseInfo.description);
    formData.append("categories", courseInfo.categories);
    formData.append("price", courseInfo.price);
    formData.append("estimatedPrice", courseInfo.estimatedPrice);
    formData.append("tags", courseInfo.tags);
    formData.append("level", courseInfo.level);
    formData.append("demoUrl", courseInfo.demoUrl);

    if (courseInfo.thumbnail && typeof courseInfo.thumbnail !== "string") {
      formData.append("thumbnail", courseInfo.thumbnail);
    }

    courseContentData.forEach((content) => {
      if (content.videoFile) {
        formData.append("video", content.videoFile);
        formData.append("videoTitles", content.title);
        formData.append("videoDescriptions", content.description);
        formData.append("videoSections", content.videoSection);
      }
    });

    if (videosToDelete.length > 0) {
      videosToDelete.forEach((id) => formData.append("videosToDelete", id));
    }

    await editCourse({ id, data: formData });
  };

  return (
    <div className="w-full flex min-h-screen">
      <div className="w-[80%]">
        {active === 0 && (
          <CourseInformation
            courseInfo={courseInfo}
            setCourseInfo={setCourseInfo}
            active={active}
            setActive={setActive}
          />
        )}
        {active === 1 && (
          <CourseData
            benefits={benefits}
            setBenefits={setBenefits}
            prerequisites={prerequisites}
            setPrerequisites={setPrerequisites}
            active={active}
            setActive={setActive}
          />
        )}
        {active === 2 && (
          <CourseContent
            active={active}
            setActive={setActive}
            courseContentData={courseContentData}
            setCourseContentData={setCourseContentData}
            handleSubmit={handleSubmit}
            videosToDelete={videosToDelete}
            setVideosToDelete={setVideosToDelete}
            isEdit={true}
          />
        )}
        {active === 3 && (
          <CoursePreview
            active={active}
            setActive={setActive}
            courseData={{
              ...courseInfo,
              benefits,
              prerequisites,
              courseData: courseContentData,
            }}
            handleCourseCreate={handleSubmit}
            isEdit={true}
          />
        )}
      </div>
      <div className="w-[20%] mt-[100px] h-screen fixed z-[-1] top-18 right-0">
        <CourseOptions active={active} setActive={setActive} />
      </div>
    </div>
  );
};

export default EditCourse;
