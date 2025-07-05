import { styles } from "@/app/styles/style";
import {
  useEditLayoutMutation,
  useGetHeroDataQuery,
} from "@/redux/features/layout/layoutApi";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { AiOutlineDelete } from "react-icons/ai";
import { HiMinus, HiPlus } from "react-icons/hi";
import { IoMdAddCircleOutline } from "react-icons/io";
import Loader from "../../Loader/Loader";

type Props = {};

const EditFaq = (props: Props) => {
  const { data, isLoading, refetch } = useGetHeroDataQuery("FAQ", {
    refetchOnMountOrArgChange: true,
  });
  const [editLayout, { isSuccess: layoutSuccess, error, isLoading: isUpdating }] =
    useEditLayoutMutation();
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (data?.layout?.faq) {
      setQuestions(data.layout.faq);
    } else {
      setQuestions([]);
    }
    if (layoutSuccess) {
      toast.success("FAQ updated successfully");
      refetch(); // إعادة جلب البيانات بعد النجاح
    }
    if (error) {
      if ("data" in error) {
        const errorData = error as any;
        toast.error(errorData?.data?.message || "Failed to load FAQ");
      }
    }
  }, [data, layoutSuccess, error, refetch]);

  const toggleQuestion = (id: any) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q._id === id ? { ...q, active: !q.active } : q))
    );
  };

  const handleQuestionChange = (id: any, value: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q._id === id ? { ...q, question: value } : q))
    );
  };

  const handleAnswerChange = (id: any, value: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q._id === id ? { ...q, answer: value } : q))
    );
  };

  const newFaqHandler = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        answer: "",
        _id: Math.random().toString(),
      },
    ]);
  };

  const areQuestionsUnchanged = (
    originalQuestions: any[],
    newQuestions: any[]
  ) => {
    return JSON.stringify(originalQuestions) === JSON.stringify(newQuestions);
  };

  const isAnyQuestionEmpty = (questions: any[]) => {
    return questions.some((q) => q.question === "" || q.answer === "");
  };

  const handleEdit = async () => {
    if (
      !areQuestionsUnchanged(data?.layout?.faq || [], questions) &&
      !isAnyQuestionEmpty(questions)
    ) {
      await editLayout({
        type: "FAQ",
        faq: questions,
      });
    }
  };

  return (
    <div className="relative white dark:bg-gray-900 min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Animation */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-green-400 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute top-1/3 right-16 w-32 h-32 bg-purple-400 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute bottom-10 left-1/4 w-48 h-48 bg-blue-400 rounded-full opacity-30 animate-pulse"></div>

      {/* Content */}
      <div className="w-full max-w-2xl z-10">
        {isLoading || isUpdating ? (
          <Loader />
        ) : (
          <div className="w-[90%] 800px:w-[80%] m-auto mt-[120px]">
            <div className="mt-12">
              <dl className="space-y-4">
                {questions.map((q: any) => (
                  <div
                    key={q._id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4"
                  >
                    <dt className="text-lg">
                      <button
                        className="w-full flex justify-between items-center text-left focus:outline-none"
                        onClick={() => toggleQuestion(q._id)}
                      >
                        <input
                          className={`${styles.input} border-none text-gray-800 dark:text-gray-100 font-Poppins break-words`}
                          value={q.question}
                          onChange={(e: any) =>
                            handleQuestionChange(q._id, e.target.value)
                          }
                          placeholder={"Add your question..."}
                        />
                        <span>
                          {q.active ? (
                            <HiMinus className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                          ) : (
                            <HiPlus className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                          )}
                        </span>
                      </button>
                    </dt>
                    {q.active && (
                      <dd className="mt-4">
                        <input
                          className={`${styles.input} border-none text-gray-600 dark:text-gray-300 text-sm font-Poppins break-words`}
                          value={q.answer}
                          onChange={(e: any) =>
                            handleAnswerChange(q._id, e.target.value)
                          }
                          placeholder={"Add your answer..."}
                        />
                        <span className="ml-6 flex-shrink-0">
                          <AiOutlineDelete
                            className="dark:text-white text-black text-[18px] cursor-pointer"
                            onClick={() => {
                              setQuestions((prevQuestions) =>
                                prevQuestions.filter((item) => item._id !== q._id)
                              );
                            }}
                          />
                        </span>
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
              <br />
              <br />
              <IoMdAddCircleOutline
                className="dark:text-white text-black text-[25px] cursor-pointer"
                onClick={newFaqHandler}
              />
            </div>

            <div
              className={`${styles.button} !w-[100px] !min-h-[40px] !h-[40px] dark:text-white text-black bg-[#cccccc34] 
                ${
                  areQuestionsUnchanged(data?.layout?.faq || [], questions) ||
                  isAnyQuestionEmpty(questions)
                    ? "!cursor-not-allowed"
                    : "!cursor-pointer !bg-[#42d383]"
                }
                !rounded fixed bottom-12 right-12`}
              onClick={
                areQuestionsUnchanged(data?.layout?.faq || [], questions) ||
                isAnyQuestionEmpty(questions)
                  ? () => null
                  : handleEdit
              }
            >
              Save
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditFaq;