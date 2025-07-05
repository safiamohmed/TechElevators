import React, { FC, useState } from "react";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import { MdOutlineOndemandVideo } from "react-icons/md";
import { useRouter } from "next/navigation";
type Props = {
  data: any;
  activeVideo?: number;
  setActiveVideo?: any;
  isDemo?: boolean;
  courseId: string;
};

const formatDuration = (seconds: number): string => {
  if (!seconds) return "0 min";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    const hourText = hours === 1 ? "hour" : "hours";
    return `${hours} ${hourText} ${minutes.toString().padStart(2, "0")} min`;
  }
  return `${minutes} min ${remainingSeconds.toString().padStart(2, "0")} sec`;
};



const CourseContentList: FC<Props> = (props) => {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set<string>());
  const router = useRouter(); // ✅ استخدم الراوتر

  const videoSections: string[] = [
    ...Array.from(new Set<string>(props.data?.map((item: any) => item.videoSection))),
  ];

  let totalCount: number = 0;

  const toggleSection = (section: string) => {
    const newVisibleSections = new Set(visibleSections);
    newVisibleSections.has(section)
      ? newVisibleSections.delete(section)
      : newVisibleSections.add(section);
    setVisibleSections(newVisibleSections);
  };

  return (
    <div className={`mt-[15px] w-full ${!props.isDemo && 'ml-[-30px] sticky top-24 left-0 z-30'}`}>
      {videoSections.map((section: string) => {
        const isSectionVisible = visibleSections.has(section);
        const sectionVideos = props.data.filter((item: any) => item.videoSection === section);
        const sectionVideoCount = sectionVideos.length;
        const sectionVideoLength = sectionVideos.reduce(
          (total: number, item: any) => total + item.videoLength,
          0
        );
        const sectionStartIndex = totalCount;
        totalCount += sectionVideoCount;

        return (
          <div
            className={`${
              !props.isDemo && 'border-b border-[#0000001c] dark:border-[#ffffff8e] pb-2 ml-9'
            }`}
            key={section}
          >
            <div className="w-full flex justify-between items-center">
              <h2 className="text-[20px] text-black dark:text-white ml-9">{section}</h2>
              <button
                className="mr-4 cursor-pointer text-black dark:text-white"
                onClick={() => toggleSection(section)}
              >
                {isSectionVisible ? <BsChevronUp size={20} /> : <BsChevronDown size={20} />}
              </button>
            </div>
            <h5 className="text-black dark:text-white ml-9">
              {sectionVideoCount} Lessons · {formatDuration(sectionVideoLength)}
            </h5>
            <br />
            <div
              className={`transition-all duration-500 ease-in-out overflow-hidden ml-9 ${
                isSectionVisible ? "max-h-screen" : "max-h-0"
              }`}
            >
              {isSectionVisible && (
                <div className="w-full">
                  {sectionVideos.map((item: any, index: number) => {
                    const videoIndex = sectionStartIndex + index;

                    return (
                      <div
                        className={`w-full ${
                          videoIndex === props.activeVideo
                            ? "bg-slate-800 dark:bg-slate-700"
                            : ""
                        } cursor-pointer transition-all p-2`}
                        key={item._id}
                        onClick={() => {
                          if (!props.isDemo && props.setActiveVideo) {
                            props.setActiveVideo(videoIndex);
                          }
                        }}
                      >
                        <div className="flex items-start">
                          <div
                            onClick={(e) => {
                              e.stopPropagation(); // ✅ عشان ما يغيرش الفيديو
                              router.push(`/course-access/${props.courseId}`); // ✅ توجيه المستخدم
                            }}
                          >
                            <MdOutlineOndemandVideo
                              size={25}
                              className="mr-9 text-blue-600 dark:text-blue-400 cursor-pointer"
                            />
                          </div>
                          <h1 className="text-[18px] break-words text-black dark:text-white">
                            {item.title}
                          </h1>
                        </div>
                        <h5 className="pl-8 text-black dark:text-white">
                          {formatDuration(item.videoLength)}
                        </h5>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CourseContentList;
