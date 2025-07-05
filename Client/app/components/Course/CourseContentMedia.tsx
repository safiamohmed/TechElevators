import { styles } from "@/app/styles/style";
import CoursePlayer from "@/app/utils/CoursePlayer";
import {
  useAddAnswerInQuestionMutation,
  useAddNewQuestionMutation,
  useAddReplyInReviewMutation,
  useAddReviewInCourseMutation,
  useGetCourseDetailsQuery,
} from "@/redux/features/courses/coursesApi";
import Image from "next/image";
import { format } from "timeago.js";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  AiFillStar,
  AiOutlineArrowLeft,
  AiOutlineArrowRight,
  AiOutlineStar,
} from "react-icons/ai";
import { BiMessage } from "react-icons/bi";
import { VscVerifiedFilled } from "react-icons/vsc";
import Ratings from "@/app/utils/Ratings";
import socketIO from "socket.io-client";
import Link from "next/link";
const ENDPOINT = process.env.NEXT_PUBLIC_SOCKET_SERVER_URI || "";
const socketId = socketIO(ENDPOINT, { transports: ["websocket"] });

type Props = {
  data: any;
  id: string;
  activeVideo: number;
  setActiveVideo: (activeVideo: number) => void;
  user: any;
  refetch: any;
};

const CourseContentMedia = ({
  data,
  id,
  activeVideo,
  setActiveVideo,
  user,
  refetch,
}: Props) => {
  const [activeBar, setactiveBar] = useState(0);
  const [question, setQuestion] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(1);
  const [answer, setAnswer] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [reply, setReply] = useState("");
  const [reviewId, setReviewId] = useState("");
  const [isReviewReply, setIsReviewReply] = useState(false);

  const [
    addNewQuestion,
    { isSuccess, error, isLoading: questionCreationLoading },
  ] = useAddNewQuestionMutation();
  const { data: courseData, refetch: courseRefetch } = useGetCourseDetailsQuery(
    id,
    { refetchOnMountOrArgChange: true }
  );
  const [
    addAnswerInQuestion,
    {
      isSuccess: answerSuccess,
      error: answerError,
      isLoading: answerCreationLoading,
    },
  ] = useAddAnswerInQuestionMutation();
  const course = courseData?.course;
  console.log("Full course data:", course);
  console.log("Course courseData:", course?.courseData);
  console.log("Data prop:", data);
  console.log("Current activeVideo:", activeVideo);
  console.log("data[activeVideo]:", data?.[activeVideo]);
  console.log("data[activeVideo].questions:", data?.[activeVideo]?.questions);
  const currentVideoQuestions = 
    data?.[activeVideo]?.questions || // من الـ data الأصلي
    course?.courseData?.[activeVideo]?.questions || // من courseData
    course?.sections?.[activeVideo]?.questions || // لو في sections
    course?.lessons?.[activeVideo]?.questions || // لو في lessons
    course?.content?.[activeVideo]?.questions || // لو في content
    [];
  const [
    addReviewInCourse,
    {
      isSuccess: reviewSuccess,
      error: reviewError,
      isLoading: reviewCreationLoading,
    },
  ] = useAddReviewInCourseMutation();

  const [
    addReplyInReview,
    {
      isSuccess: replySuccess,
      error: replyError,
      isLoading: replyCreationLoading,
    },
  ] = useAddReplyInReviewMutation();

  const isReviewExists = course?.reviews?.find(
  (item: any) => item.user?._id === user?._id
);

  const handleQuestion = () => {
    if (question.length === 0) {
      toast.error("Question can't be empty");
    } else {
      addNewQuestion({
        question,
        courseId: id,
        contentId: data[activeVideo]._id,
      });
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setQuestion("");
      refetch();
       courseRefetch(); 
      socketId.emit("notification", {
        title: `New Question Received`,
        message: `You have a new question in ${data?.[activeVideo]?.title || "the course"}`,
        userId: user._id,
      });
    }
  
    if (answerSuccess) {
      setAnswer("");
      refetch();
       courseRefetch(); 
      if (user.role !== "admin") {
        socketId.emit("notification", {
          title: `New Reply Received`,
          message: `You have a new reply in ${data?.[activeVideo]?.title || "the course"}`,
          userId: user._id,
        });
      }
    }
  
    if (error && "data" in error) {
      const errorMessage = error as any;
      toast.error(errorMessage?.data?.message || "Something went wrong.");
    }
  
    if (answerError && "data" in answerError) {
      const errorMessage = answerError as any;
      toast.error(errorMessage?.data?.message || "Something went wrong.");
    }
  
    if (reviewSuccess) {
      setReview("");
      setRating(1);
      courseRefetch();
      socketId.emit("notification", {
        title: `New Question Received`,
        message: `You have a new question in ${data?.[activeVideo]?.title || "the course"}`,
        userId: user._id,
      });
    }
  
    if (reviewError && "data" in reviewError) {
      const errorMessage = reviewError as any;
      const message = errorMessage?.data?.message || "Something went wrong.";
      toast.error(message);
    }
  
    if (replySuccess) {
      setReply("");
      courseRefetch();
    }
  
    if (replyError && "data" in replyError) {
      const errorMessage = replyError as any;
      toast.error(errorMessage?.data?.message || "Something went wrong.");
    }
  }, [
    isSuccess,
    error,
    answerSuccess,
    answerError,
    reviewSuccess,
    reviewError,
    replySuccess,
    replyError,
     refetch,
  ]);
  
  const handleAnswerSubmit = () => {
    if (!data?.[activeVideo]?._id) {
      toast.error("Can't submit answer. Content ID is missing.");
      return;
    }
  
    addAnswerInQuestion({
      answer,
      courseId: id,
      contentId: data[activeVideo]._id,
      questionId: questionId,
    });
  };
  
  const handleReviewSubmit = async () => {
    if (review.length === 0) {
      toast.error("Review can't be empty");
    } else {
      addReviewInCourse({ review, rating, courseId: id });
    }
  };
  
  const handleReviewReplySubmit = () => {
    if (!replyCreationLoading) {
      if (reply === "") {
        toast.error("Reply can't be empty");
      } else {
        addReplyInReview({ comment: reply, courseId: id, reviewId });
      }
    }
  };
  // --------------------------------------------------------------
  
  return (
    <div className="w-[95%] 800px:w-[86%] py-4 m-auto">
      <CoursePlayer
        title={data[activeVideo]?.title}
        videoUrl={data[activeVideo]?.videoUrl}
      />
      <div className="w-full flex items-center justify-between my-3">
        {/* Prev Lesson Button */}
        <div
          className={`bg-blue-600 text-white shadow-md px-4 py-2 rounded-md flex items-center transition-all duration-300 ${
            activeVideo === 0 && "!cursor-not-allowed opacity-70"
          }`}
          onClick={() =>
            setActiveVideo(activeVideo === 0 ? 0 : activeVideo - 1)
          }
        >
          <AiOutlineArrowLeft className="mr-2" />
          Prev Lesson
        </div>
  
        {/* ASK AI Button */}
        <Link
          href={`ai/${id}`}
          className="p-2 border-2 rounded-xl border-blue-600 text-black dark:text-white font-bold hover:bg-blue-600 hover:text-white transition duration-200"
        >
          ASK AI
        </Link>
  
        {/* Next Lesson Button */}
        <div
          className={`bg-blue-600 text-white shadow-md px-4 py-2 rounded-md flex items-center transition-all duration-300 ${
            data.length - 1 === activeVideo && "!cursor-not-allowed opacity-70"
          }`}
          onClick={() =>
            setActiveVideo(
              data && data.length - 1 === activeVideo
                ? activeVideo
                : activeVideo + 1
            )
          }
        >
          Next Lesson
          <AiOutlineArrowRight className="ml-2" />
        </div>
      </div>
  
      {/* Title of the current lesson */}
      <h1 className="pt-2 text-[25px] font-[600] dark:text-white text-black">
      {data?.[activeVideo]?.title || "Lesson not available"}
      </h1>


      <br />
  
      {/* ---------------------------------------------------------- */}
      <div className="w-full p-4 flex items-center justify-between bg-slate-500 bg-opacity-20 backdrop-blur shadow-[bg-slate-700] rounded shadow-inner">
  {["Overview", "Resources", "Q&A", "Reviews"].map((text, index) => (
    <h5
      key={index}
      className={`800px:text-[20px] cursor-pointer ${
        activeBar === index ? "text-[#2563eb]" : "dark:text-white text-black"
      }`}
      onClick={() => setactiveBar(index)}
    >
      {text}
    </h5>
  ))}
</div>

{/* ✅ محتوى Overview داخل box منسق */}
{activeBar === 0 && (
  <div className="mt-4 border p-4 rounded-lg shadow-md transition-all duration-300 bg-white dark:bg-slate-700 dark:bg-opacity-30 backdrop-blur border border-gray-200 dark:border-white/10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 flex flex-col justify-between">
    <p className="text-[18px] whitespace-pre-line mb-3 text-black dark:text-white">
      {data[activeVideo]?.description}
    </p>
  </div>
)}

{/* ------------------------------------------------------------- */}

{activeBar === 1 && (
  <div className="mt-4 border p-4 rounded-lg shadow-md transition-all duration-300 bg-white dark:bg-slate-700 dark:bg-opacity-30 backdrop-blur border border-gray-200 dark:border-white/10 rounded-xl shadow-lg hover:shadow-xl flex flex-col justify-between">
    {data[activeVideo]?.links.map((item: any, index: number) => (
      <div className="mb-5" key={index}>
        <h2 className="800px:text-[20px] 800px:inline-block text-black dark:text-white">
          {item.title && item.title + " :"}
        </h2>
        <a
  className="inline-block font-medium 800px:text-[20px] 800px:pl-2 break-words max-w-full overflow-hidden text-black dark:text-white"
  href={item.url}
  target="_blank"
  rel="noopener noreferrer"
  style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
>

          {item.url}
        </a>
      </div>
    ))}
  </div>
)}

{/* ------------------------------------------------------------------------------ */}
{activeBar === 2 && (
  <>
    <div className="mt-4 border p-4 rounded-lg shadow-md transition-all duration-300 bg-white dark:bg-slate-700 dark:bg-opacity-30 backdrop-blur border border-gray-200 dark:border-white/10 rounded-xl shadow-lg hover:shadow-xl flex flex-col justify-between">
      <div className="flex w-full">
        <Image
          src={
            user.avatar
              ? user.avatar.url
              : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
          }
          width={50}
          height={50}
          alt=""
          className="w-[50px] h-[50px] rounded-full object-cover"
        />
        <textarea
          name=""
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          id=""
          cols={40}
          rows={5}
          placeholder="Write your question..."
          className="outline-none bg-transparent ml-3 border dark:text-white text-black border-[#0000001d] dark:border-[#ffffff57] 800px:w-full p-2 rounded w-[90%] 800px:text-[18px] font-Poppins"
        ></textarea>
      </div>
      <div className="w-full flex justify-end">
        <div
          className={`!w-[120px] !h-[40px] text-[18px] mt-5 font-semibold flex items-center justify-center rounded-lg ${
            questionCreationLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#3b82f6] hover:bg-[#2563eb] cursor-pointer"
          } `}
          onClick={questionCreationLoading ? () => {} : handleQuestion}
        >
          Submit
        </div>
      </div>
    </div>

    <br />
    <div className="w-full h-[1px] bg-[#ffffff3b]"></div>

    <div>
      <CommentReply
              questions={currentVideoQuestions}
              data={data}
              activeVideo={activeVideo}
              answer={answer}
              setAnswer={setAnswer}
              handleAnswerSubmit={handleAnswerSubmit}
              user={user}
              questionId={questionId}
              setQuestionId={setQuestionId}
              answerCreationLoading={answerCreationLoading}
      />
    </div>
  </>
)}

{/* --------------------------------------------------------------- */}
      {activeBar === 3 && (
        <div className="w-full">
          <>
            {!isReviewExists && (
              <>
              <div className="mt-4 border p-4 rounded-lg shadow-md transition-all duration-300 bg-white dark:bg-slate-700 dark:bg-opacity-30 backdrop-blur border border-gray-200 dark:border-white/10 rounded-xl shadow-lg hover:shadow-xl flex flex-col justify-between">

                <div className="flex w-full">
                  <Image
                    src={
                      user.avatar
                        ? user.avatar.url
                        : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
                    }
                    width={50}
                    height={50}
                    alt=""
                    className="w-[50px] h-[50px] rounded-full object-cover"
                  />
                  <div className="w-full">
                    <h5 className="pl-3 text-[20px] font-[500] dark:text-white text-black ">
                      Give a Rating <span className="text-red-500">*</span>
                    </h5>
                    <div className="flex w-full ml-2 pb-3">
                      {[1, 2, 3, 4, 5].map((i) =>
                        rating >= i ? (
                          <AiFillStar
                            key={i}
                            className="mr-1 cursor-pointer"
                            color="rgb(246,186,0)"
                            size={25}
                            onClick={() => setRating(i)}
                          />
                        ) : (
                          <AiOutlineStar
                            key={i}
                            className="mr-1 cursor-pointer"
                            color="rgb(246,186,0)"
                            size={25}
                            onClick={() => setRating(i)}
                          />
                        )
                      )}
                    </div>
                    <textarea
                      name=""
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      id=""
                      cols={40}
                      rows={5}
                      placeholder="Write your comment..."
                      className="outline-none bg-transparent 800px:ml-3 dark:text-white text-black border border-[#00000027] dark:border-[#ffffff57] w-[95%] 800px:w-full p-2 rounded text-[18px] font-Poppins"
                    ></textarea>
                  </div>
                </div>
                <div className="w-full flex justify-end">
                <div
  className={`!w-[120px] !h-[40px] text-[18px] mt-5 800px:mr-0 mr-2 flex items-center justify-center rounded-md text-white font-medium transition duration-300 ${
    reviewCreationLoading
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-[#3b82f6] hover:bg-[#2563eb] cursor-pointer"
  }`}
  onClick={reviewCreationLoading ? () => {} : handleReviewSubmit}
>
  Submit
</div>


                </div>
                </div>
              </>
            )}
            {/* --------------------------------------------------------- */}
            <br />
            <div className="w-full h-[1px] bg-[#ffffff3b]"></div>
            <div className="w-full">
              {(course?.reviews && [...course.reviews].reverse())?.map(
                (item: any, index: number) => {
                  return (
                    <div
                      className="w-full my-5 dark:text-white text-black"
                      key={index}
                    >
                      <div className="w-full flex">
                        <div>
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
                        <div className="ml-2">
                          <h1 className="text-[18px]">{item?.user.name}</h1>
                          <Ratings rating={item.rating} />
                          <p>{item.review}</p>
                          <small className="text-[#0000009e] dark:text-[#ffffff83]">
                            {format(item.createdAt)} •
                          </small>
                        </div>
                      </div>
                      {user.role === "admin" &&
                        item.commentReplies.length === 0 && (
                          <span
                            className={`${styles.label} !ml-10 cursor-pointer`}
                            onClick={() => {
                              setIsReviewReply(true);
                              setReviewId(item._id);
                            }}
                          >
                            Add Reply
                          </span>
                        )}

                      {isReviewReply && reviewId === item._id && (
                        <div className="w-full flex relative">
                          <input
                            type="text"
                            placeholder="Enter your reply..."
                            value={reply}
                            onChange={(e: any) => setReply(e.target.value)}
                            className="block 800px:ml-12 mt-2 outline-none bg-transparent border-b border-[#000] dark:border-[#fff] p-[5px] w-[95%]"
                          />
                          <button
                            type="submit"
                            className="absolute right-0 bottom-1"
                            onClick={handleReviewReplySubmit}
                          >
                            Submit
                          </button>
                        </div>
                      )}

                      {item.commentReplies.map((i: any, index: number) => (
                        <div
                          className="w-full flex 800px:ml-16 my-5"
                          key={index}
                        >
                          <div className="w-[50px] h-[50px]">
                            <Image
                              src={
                                i.user.avatar
                                  ? i.user.avatar.url
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
                              <h5 className="text-[20px]">{i.user.name}</h5>{" "}
                              <VscVerifiedFilled className="text-[#0095F6] ml-2 text-[20px]" />
                            </div>
                            <p>{i.review}</p>
                            <small className="text-[#ffffff83]">
                              {format(i.createdAt)} •
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
              )}
            </div>
          </>
        </div>
      )}
    </div>
  );
};
// -------------------------------------------------------------------
const CommentReply = ({
  questions,
  data,
  activeVideo,
  answer,
  setAnswer,
  handleAnswerSubmit,
  questionId,
  setQuestionId,
  answerCreationLoading,
}: any) => {
  console.log("Current questions:", questions);
  console.log("Questions length:", questions?.length);
 return (
  <>
    <div className="w-full my-3">
  {data?.[activeVideo]?.questions?.length > 0 ? (
    data[activeVideo].questions.map((item: any, index: any) => (
      <CommentItem
        key={item._id || index} // ✅ استخدم _id كـ key
        data={data}
        activeVideo={activeVideo}
        item={item}
        index={index}
        answer={answer}
        setAnswer={setAnswer}
        questionId={questionId}
        setQuestionId={setQuestionId}
        handleAnswerSubmit={handleAnswerSubmit}
        answerCreationLoading={answerCreationLoading}
      />
    ))
  ) : (
    <p className="text-gray-500 dark:text-gray-300 italic text-sm">
      No questions yet.
    </p>
  )}
</div>

  </>
);
};

const CommentItem = ({
  questionId,
  setQuestionId,
  item,
  answer,
  setAnswer,
  handleAnswerSubmit,
  answerCreationLoading,
}: any) => {
  const [replyActive, setreplyActive] = useState(false);
  return (
    <>
      <div className="my-4">
        <div className="flex mb-2">
          <div>
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
          <div className="pl-3 dark:text-white text-black">
            <h5 className="text-[20px]">{item?.user.name}</h5>
            <p>{item?.question}</p>
            <small className="text-[#000000b8] dark:text-[#ffffff83]">
              {!item.createdAt ? "" : format(item?.createdAt)} •
            </small>
          </div>
        </div>
        <div className="w-full flex">
          <span
            className="800px:pl-16 text-[#000000b8] dark:text-[#ffffff83] cursor-pointer mr-2"
            onClick={() => {
              setreplyActive(!replyActive);
              setQuestionId(item._id);
            }}
          >
            {!replyActive
              ? item.questionReplies.length !== 0
                ? "All Replies"
                : "Add Reply"
              : "Hide Replies"}
          </span>
          <BiMessage
            size={20}
            className="dark:text-[#ffffff83] cursor-pointer text-[#000000b8]"
          />
          <span className="pl-1 mt-[-4px] cursor-pointer text-[#000000b8] dark:text-[#ffffff83]">
            {item.questionReplies.length}
          </span>
        </div>

        {replyActive && questionId === item._id && (
          <>
            {item.questionReplies.map((item: any) => (
              <div
                className="w-full flex 800px:ml-16 my-5 text-black dark:text-white"
                key={item._id}
              >
                <div>
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
                <div className="pl-3">
                  <div className="flex items-center">
                    <h5 className="text-[20px]">{item.user.name}</h5>{" "}
                    {item.user.role === "admin" && (
                      <VscVerifiedFilled className="text-[#0095F6] ml-2 text-[20px]" />
                    )}
                  </div>
                  <p>{item.answer}</p>
                  <small className="text-[#ffffff83]">
                    {format(item.createdAt)} •
                  </small>
                </div>
              </div>
            ))}
            <>
              <div className="w-full flex relative dark:text-white text-black">
                <input
                  type="text"
                  placeholder="Enter your answer..."
                  value={answer}
                  onChange={(e: any) => setAnswer(e.target.value)}
                  className={`block 800px:ml-12 mt-2 outline-none bg-transparent border-b border-[#00000027] dark:text-white text-black dark:border-[#fff] p-[5px] w-[95%] ${
                    answer === "" ||
                    (answerCreationLoading && "cursor-not-allowed")
                  }`}
                />
                <button
                  type="submit"
                  className="absolute right-0 bottom-1"
                  onClick={handleAnswerSubmit}
                  disabled={answer === "" || answerCreationLoading}
                >
                  Submit
                </button>
              </div>
              <br />
            </>
          </>
        )}
      </div>
    </>
  );
};

export default CourseContentMedia;
