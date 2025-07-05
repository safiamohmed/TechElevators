
"use client";
import React, { useEffect, useState } from "react";
import CourseInformation from "./CourseInformation";
import CourseOptions from "./CourseOptions";
import CourseData from "./CourseData";
import CourseContent from "./CourseContent";
import CoursePreview from "./CoursePreview";
import { useCreateCourseMutation } from "../../../../redux/features/courses/coursesApi";
import { toast } from "react-hot-toast";
import { redirect } from "next/navigation";

type Props = {};

const CreateCourse = (props: Props) => {
  const [createCourse, { isLoading, isSuccess, error }] =
    useCreateCourseMutation();

  useEffect(() => {
    if (isSuccess) {
      toast.success("Course created successfully");
      redirect("/admin/courses");
    }
    if (error) {
      if ("data" in error) {
        const errorMessage = error as any;
        toast.error(errorMessage.data.message);
      }
    }
  }, [isSuccess, error]);

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
    thumbnail: "",
  });
  const [benefits, setBenefits] = useState([{ title: "" }]);
  const [prerequisites, setPrerequisites] = useState([{ title: "" }]);
  const [courseContentData, setCourseContentData] = useState([
    {
      videoUrl: "",
      videoFile: null,
      title: "",
      description: "",
      videoSection: "Untitled Section",
      videoLength: "",
      links: [{ title: "", url: "" }],
      suggestion: "",
    },
  ]);

  const [courseData, setCourseData] = useState({});

  const handleSubmit = async ({ videosToDelete }: { videosToDelete?: string[] }) => {
    const formattedBenefits = benefits.map((benefit) => ({ title: benefit.title }));
    const formattedPrerequisites = prerequisites.map((prerequisite) => ({ title: prerequisite.title }));
    console.log("Formatted Benefits:", formattedBenefits); // للتحقق
    console.log("Formatted Prerequisites:", formattedPrerequisites); // للتحقق

    const formattedCourseContentData = courseContentData.map((courseContent) => ({
      title: courseContent.title,
      description: courseContent.description,
      videoSection: courseContent.videoSection,
      videoLength: courseContent.videoLength,
      links: courseContent.links.map((link) => ({ title: link.title, url: link.url })),
      suggestion: courseContent.suggestion,
      videoUrl: courseContent.videoUrl || "",
    }));

    const data = {
      name: courseInfo.name,
      description: courseInfo.description,
      categories: courseInfo.categories,
      price: courseInfo.price,
      estimatedPrice: courseInfo.estimatedPrice,
      tags: courseInfo.tags,
      level: courseInfo.level,
      demoUrl: courseInfo.demoUrl,
      totalVideos: courseContentData.length,
      benefits: formattedBenefits,
      prerequisites: formattedPrerequisites,
      courseData: formattedCourseContentData,
      videosToDelete: videosToDelete || [],
    };

    setCourseData(data);
  };

  const handleCourseCreate = async () => {
    if (isLoading) return;

    const formData = new FormData();
    formData.append("name", courseInfo.name);
    if (!courseInfo.name) {
      toast.error("Course name is required!");
      return;
    }
    formData.append("description", courseInfo.description);
    formData.append("categories", courseInfo.categories);
    formData.append("price", courseInfo.price);
    formData.append("estimatedPrice", courseInfo.estimatedPrice); // تصحيح الخطأ هنا
    formData.append("tags", courseInfo.tags);
    formData.append("level", courseInfo.level);
    formData.append("demoUrl", courseInfo.demoUrl);
    if (courseInfo.thumbnail) {
      formData.append("thumbnail", courseInfo.thumbnail);
    }
    // تحويل benefits و prerequisites إلى JSON
  const formattedBenefits = benefits.map((benefit) => ({ title: benefit.title }));
  const formattedPrerequisites = prerequisites.map((prerequisite) => ({ title: prerequisite.title }));
  console.log("Formatted Benefits before sending:", formattedBenefits);
  console.log("Formatted Prerequisites before sending:", formattedPrerequisites);

  formData.append("benefits", JSON.stringify(formattedBenefits));
  formData.append("prerequisites", JSON.stringify(formattedPrerequisites));

    courseContentData.forEach((content, index) => {
      if (content.videoFile) {
        formData.append("video", content.videoFile);
        formData.append(`videoTitles[${index}]`, content.title);
        formData.append(`videoDescriptions[${index}]`, content.description);
        formData.append(`videoSections[${index}]`, content.videoSection);
      }
      formData.append(`videoUrls[${index}]`, content.videoUrl || "");
    });
    console.log("Final formData:", Object.fromEntries(formData));

    await createCourse(formData);
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
            videosToDelete={[]}
            setVideosToDelete={() => {}}
            isEdit={false}
          />
        )}
        {active === 3 && (
          <CoursePreview
            active={active}
            setActive={setActive}
            courseData={courseData}
            handleCourseCreate={handleCourseCreate}
          />
        )}
      </div>
      <div className="w-[20%] mt-[100px] h-screen fixed z-[-1] top-18 right-0">
        <CourseOptions active={active} setActive={setActive} />
      </div>
    </div>
  );
};

export default CreateCourse;