import { styles } from "@/app/styles/style";
import React, { FC, useState } from "react";
import { toast } from "react-hot-toast";
import { AiOutlineDelete, AiOutlinePlusCircle } from "react-icons/ai";
import { BsLink45Deg, BsPencil } from "react-icons/bs";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";

type Props = {
  active: number;
  setActive: (active: number) => void;
  courseContentData: any;
 setCourseContentData: (courseContentData: any) => void;
  handleSubmit: any;
  videosToDelete?: string[]; // اختياري
  setVideosToDelete?: (videosToDelete: string[]) => void; // اختياري
  isEdit?: boolean;
};

const CourseContent: FC<Props> = ({
  courseContentData,
  setCourseContentData,
  active,
  setActive,
  handleSubmit,
  videosToDelete = [], // قيمة افتراضية فارغة لو مش موجود
  setVideosToDelete = () => {}, // دالة فارغة لو مش موجودة
  isEdit,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(
    Array(courseContentData.length).fill(false)
  );
  const [activeSection, setActiveSection] = useState(1);

  const handleSubmitForm = (e: any) => {
    e.preventDefault();
  };

  const handleCollapseToggle = (index: number) => {
    const updatedCollasped = [...isCollapsed];
    updatedCollasped[index] = !updatedCollasped[index];
    setIsCollapsed(updatedCollasped);
  };

  const handleRemoveLink = (index: number, linkIndex: number) => {
    const updatedData = [...courseContentData];
    updatedData[index].links.splice(linkIndex, 1);
    setCourseContentData(updatedData);
  };

  const handleAddLink = (index: number) => {
    const updatedData = [...courseContentData];
    updatedData[index].links.push({ title: "", url: "" });
    setCourseContentData(updatedData);
  };

  const handleVideoChange = (index: number, file: File) => {
    const updatedData = [...courseContentData];
    updatedData[index].videoFile = file;
    setCourseContentData(updatedData);
  };

  const handleRemoveVideo = (index: number, videoId?: string) => {
    const updatedData = [...courseContentData];
    if (videoId && isEdit) {
      setVideosToDelete([...videosToDelete, videoId]);
    }
    updatedData.splice(index, 1);
    setCourseContentData(updatedData);
  };

  const newContentHandler = (item: any) => {
    if (
      item.title === "" ||
      item.description === "" ||
      (!item.videoFile && !item.videoUrl)
    ) {
      toast.error("Please fill all required fields (title, description, video)!");
    } else {
      let newVideoSection = "";
      if (courseContentData.length > 0) {
        const lastVideoSection =
          courseContentData[courseContentData.length - 1].videoSection;
        if (lastVideoSection) {
          newVideoSection = lastVideoSection;
        }
      }
      const newContent = {
        videoUrl: "",
        videoFile: null,
        title: "",
        description: "",
        videoSection: newVideoSection || `Untitled Section ${activeSection}`,
        videoLength: "",
        links: [{ title: "", url: "" }],
        suggestion: "",
        _id: "",
      };
      setCourseContentData([...courseContentData, newContent]);
    }
  };

  const addNewSection = () => {
    if (
      courseContentData[courseContentData.length - 1]?.title === "" ||
      courseContentData[courseContentData.length - 1]?.description === "" ||
      (!courseContentData[courseContentData.length - 1]?.videoFile &&
        !courseContentData[courseContentData.length - 1]?.videoUrl)
    ) {
      toast.error("Please fill all required fields in the current section!");
    } else {
      setActiveSection(activeSection + 1);
      const newContent = {
        videoUrl: "",
        videoFile: null,
        title: "",
        description: "",
        videoLength: "",
        videoSection: `Untitled Section ${activeSection + 1}`,
        links: [{ title: "", url: "" }],
        suggestion: "",
        _id: "",
      };
      setCourseContentData([...courseContentData, newContent]);
    }
  };

  const prevButton = () => {
    setActive(active - 1);
  };

  const handleOptions = () => {
    if (
      courseContentData[courseContentData.length - 1]?.title === "" ||
      courseContentData[courseContentData.length - 1]?.description === "" ||
      (!courseContentData[courseContentData.length - 1]?.videoFile &&
        !courseContentData[courseContentData.length - 1]?.videoUrl)
    ) {
      toast.error("Section can't be empty!");
    } else {
      setActive(active + 1);
      handleSubmit({ videosToDelete });
    }
  };

  return (
    <div className="w-[80%] m-auto mt-24 p-3">
      <form onSubmit={handleSubmitForm}>
        {courseContentData?.map((item: any, index: number) => {
          const showSectionInput =
            index === 0 ||
            item.videoSection !== courseContentData[index - 1]?.videoSection;

          return (
            <div
              className={`w-full bg-[#cdc8c817] p-4 ${
                showSectionInput ? "mt-10" : "mb-0"
              }`}
              key={index}
            >
              {showSectionInput && (
                <>
                  <div className="flex w-full items-center">
                    <input
                      type="text"
                      className={`text-[20px] ${
                        item.videoSection === "Untitled Section"
                          ? "w-[170px]"
                          : "w-min"
                      } font-Poppins cursor-pointer dark:text-white text-black bg-transparent outline-none`}
                      value={item.videoSection}
                      onChange={(e) => {
                        const updatedData = [...courseContentData];
                        updatedData[index].videoSection = e.target.value;
                        setCourseContentData(updatedData);
                      }}
                    />
                    <BsPencil className="cursor-pointer dark:text-white text-black" />
                  </div>
                  <br />
                </>
              )}

              <div className="flex w-full items-center justify-between my-0">
                {isCollapsed[index] ? (
                  <>
                    {item.title ? (
                      <p className="font-Poppins dark:text-white text-black">
                        {index + 1}. {item.title}
                      </p>
                    ) : (
                      <></>
                    )}
                  </>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center">
                  <AiOutlineDelete
                    className={`dark:text-white text-[20px] mr-2 text-black ${
                      index > 0 ? "cursor-pointer" : "cursor-no-drop"
                    }`}
                    onClick={() => handleRemoveVideo(index, item._id)}
                  />
                  <MdOutlineKeyboardArrowDown
                    fontSize="large"
                    className="dark:text-white text-black"
                    style={{
                      transform: isCollapsed[index]
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                    onClick={() => handleCollapseToggle(index)}
                  />
                </div>
              </div>
              {!isCollapsed[index] && (
                <>
                  <div className="my-3">
                    <label className={styles.label}>Video Title</label>
                    <input
                      type="text"
                      placeholder="Project Plan..."
                      className={`${styles.input}`}
                      value={item.title || ""}
                      onChange={(e) => {
                        const updatedData = [...courseContentData];
                        updatedData[index].title = e.target.value;
                        setCourseContentData(updatedData);
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className={styles.label}>Video Url (Optional)</label>
                    <input
                      type="text"
                      placeholder="Video URL"
                      className={`${styles.input}`}
                      value={item.videoUrl || ""}
                      onChange={(e) => {
                        const updatedData = [...courseContentData];
                        updatedData[index].videoUrl = e.target.value;
                        setCourseContentData(updatedData);
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className={styles.label}>Upload Video</label>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      id={`video-${index}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleVideoChange(index, file);
                        }
                      }}
                    />
                    <label
                      htmlFor={`video-${index}`}
                      className="w-full min-h-[10vh] dark:border-white border-[#00000026] p-3 border flex items-center justify-center cursor-pointer"
                    >
                      {item.videoFile?.name || item.videoUrl
                        ? item.videoFile?.name || "Existing video"
                        : "Upload a video"}
                    </label>
                  </div>
                  <div className="mb-3">
                    <label className={styles.label}>
                      Video Length (in minutes)
                    </label>
                    <input
                      type="number"
                      placeholder="20"
                      className={`${styles.input}`}
                      value={item.videoLength || ""}
                      onChange={(e) => {
                        const updatedData = [...courseContentData];
                        updatedData[index].videoLength = e.target.value;
                        setCourseContentData(updatedData);
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className={styles.label}>Video Description</label>
                    <textarea
                      rows={8}
                      cols={30}
                      placeholder="Video description"
                      className={`${styles.input} !h-min py-2`}
                      value={item.description || ""}
                      onChange={(e) => {
                        const updatedData = [...courseContentData];
                        updatedData[index].description = e.target.value;
                        setCourseContentData(updatedData);
                      }}
                    />
                  </div>
                  {item?.links.map((link: any, linkIndex: number) => (
                    <div className="mb-3 block" key={linkIndex}>
                      <div className="w-full flex items-center justify-between">
                        <label className={styles.label}>
                          Link {linkIndex + 1}
                        </label>
                        <AiOutlineDelete
                          className={`${
                            linkIndex === 0
                              ? "cursor-no-drop"
                              : "cursor-pointer"
                          } text-black dark:text-white text-[20px]`}
                          onClick={() =>
                            linkIndex === 0
                              ? null
                              : handleRemoveLink(index, linkIndex)
                          }
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Source Code... (Link title)"
                        className={`${styles.input}`}
                        value={link.title || ""}
                        onChange={(e) => {
                          const updatedData = [...courseContentData];
                          updatedData[index].links[linkIndex].title =
                            e.target.value;
                          setCourseContentData(updatedData);
                        }}
                      />
                      <input
                        type="url"
                        placeholder="Source Code Url... (Link URL)"
                        className={`${styles.input} mt-6`}
                        value={link.url || ""}
                        onChange={(e) => {
                          const updatedData = [...courseContentData];
                          updatedData[index].links[linkIndex].url =
                            e.target.value;
                          setCourseContentData(updatedData);
                        }}
                      />
                    </div>
                  ))}
                  <div className="inline-block mb-4">
                    <p
                      className="flex items-center text-[18px] dark:text-white text-black cursor-pointer"
                      onClick={() => handleAddLink(index)}
                    >
                      <BsLink45Deg className="mr-2" /> Add Link
                    </p>
                  </div>
                </>
              )}
              {index === courseContentData.length - 1 && (
                <div>
                  <p
                    className="flex items-center text-[18px] dark:text-white text-black cursor-pointer"
                    onClick={() => newContentHandler(item)}
                  >
                    <AiOutlinePlusCircle className="mr-2" /> Add New Content
                  </p>
                </div>
              )}
            </div>
          );
        })}
        <div
          className="flex items-center text-[20px] dark:text-white text-black cursor-pointer"
          onClick={() => addNewSection()}
        >
          <AiOutlinePlusCircle className="mr-2" /> Add new Section
        </div>
      </form>
      <div className="w-full flex items-center justify-between">
        <div
          className="w-full 800px:w-[180px] flex items-center justify-center h-[40px] bg-[#37a39a] text-center text-[#fff] rounded mt-8 cursor-pointer"
          onClick={() => prevButton()}
        >
          Prev
        </div>
        <div
          className="w-full 800px:w-[180px] flex items-center justify-center h-[40px] bg-[#37a39a] text-center text-[#fff] rounded mt-8 cursor-pointer"
          onClick={() => handleOptions()}
        >
          Next
        </div>
      </div>
      {isEdit && videosToDelete.length > 0 && (
        <div className="mt-4">
          <p className="text-red-500">
            Videos to be deleted: {videosToDelete.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseContent;