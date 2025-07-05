import { styles } from '@/app/styles/style';
import { useGetHeroDataQuery } from '@/redux/features/layout/layoutApi';
import React, { useEffect, useState } from 'react';
import { HiMinus, HiPlus } from 'react-icons/hi';

type Props = {};

const FAQ = (props: Props) => {
  const { data, refetch } = useGetHeroDataQuery("FAQ", {
    refetchOnMountOrArgChange: true,
  });
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (data) {
      setQuestions(data.layout?.faq || []);
    }
  }, [data]);

  const toggleQuestion = (id: string) => {
    setActiveQuestion(activeQuestion === id ? null : id);
  };

  return (
    <div className="text-black dark:text-white min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Animation */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-green-400 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute top-1/3 right-16 w-32 h-32 bg-purple-400 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute bottom-10 left-1/4 w-48 h-48 bg-blue-400 rounded-full opacity-30 animate-pulse"></div>

      {/* Content */}
      <div className="w-full max-w-2xl z-10">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">
          Frequently Asked Questions
        </h1>
        <div className="space-y-4">
          {questions?.length > 0 ? (
            questions.map((q) => (
              <div
                key={q._id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4"
              >
                <button
                  className="w-full flex justify-between items-center text-left focus:outline-none"
                  onClick={() => toggleQuestion(q._id)}
                >
                  <span className="text-lg font-medium text-gray-800 dark:text-gray-100 font-Poppins break-words">
                    {q.question}
                  </span>
                  <span>
                    {activeQuestion === q._id ? (
                      <HiMinus className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <HiPlus className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    )}
                  </span>
                </button>
                {activeQuestion === q._id && (
                  <div className="mt-4 text-gray-600 dark:text-gray-300 text-sm font-Poppins break-words">
                    {q.answer}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">No FAQ data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQ;