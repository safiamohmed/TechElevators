import React from "react";
import CourseDetailsPage from "../../components/Course/CourseDetailsPage";

const Page = async ({ params }: { params: { id: string } }) => {
  const { id } = params; // Destructure id from params
  return (
    <div>
      <CourseDetailsPage id={id} />
    </div>
  );
};

export default Page;