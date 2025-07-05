"use client";
import { ThemeSwitcher } from "@/app/utils/ThemeSwitcher";
import {
  useGetAllNotificationsQuery,
  useUpdateNotificationStatusMutation,
} from "@/redux/features/notifications/notificationsApi";
import React, { FC, useEffect, useState } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import socketIO from "socket.io-client";
import { format } from "timeago.js";
const ENDPOINT = process.env.NEXT_PUBLIC_SOCKET_SERVER_URI || "";
const socketId = socketIO(ENDPOINT, { transports: ["websocket"] });

type Props = {
  open?: boolean;
  setOpen?: any;
};

const DashboardHeader: FC<Props> = ({ open, setOpen }) => {
  const { data, refetch } = useGetAllNotificationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [updateNotificationStatus, { isSuccess }] =
    useUpdateNotificationStatusMutation();
  const [notifications, setNotifications] = useState<any>([]);
  const [audio] = useState<any>(new Audio("/Notification.mp3")); // تعديل المسار هنا

  const playNotificationSound = () => {
    audio.play();
  };

  useEffect(() => {
    if (data) {
      setNotifications(
        data.notifications.filter((item: any) => item.status === "unread")
      );
    }
    if (isSuccess) {
      refetch();
    }
    audio.load();
  }, [data, isSuccess, audio]);

  useEffect(() => {
    socketId.on("newNotification", () => {
      refetch();
      playNotificationSound();
    });
  }, []);

  const handleNotificationStatusChange = async (id: string) => {
    await updateNotificationStatus(id);
  };

  return (
    <header className="w-full fixed top-0 right-0 z-50 bg-white/30 dark:bg-[#0f172a]/40 backdrop-blur-md shadow-md border-b border-slate-200 dark:border-[#ffffff10]">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-6 py-4">
       <h2 className="text-xl font-semibold text-gray-800 dark:text-white ml-[302px]">
  Admin Panel
</h2>

        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <div
  className="relative cursor-pointer"
  onClick={() => setOpen(!open)}
>
  <IoMdNotificationsOutline
    className={`text-2xl dark:text-white text-black transition-all duration-300 ${
      notifications.length > 0 ? "text-[#3ccba0] animate-bounce" : ""
    }`}
  />
  {notifications.length > 0 && (
    <span className="absolute -top-2 -right-2 bg-[#3ccba0] rounded-full w-[20px] h-[20px] text-[12px] flex items-center justify-center text-white">
      {notifications.length}
    </span>
  )}
</div>

        </div>
      </div>

      {open && (
        <div className="absolute right-4 top-20 w-[350px] h-[60vh] overflow-y-auto rounded-lg shadow-lg border border-[#ffffff0c] dark:bg-[#111C43] bg-white z-50">
          <h5 className="text-center text-lg font-medium p-3 border-b border-gray-200 dark:border-[#ffffff0f] text-black dark:text-white">
            Notifications
          </h5>
          {notifications.map((item: any, index: number) => (
            <div
              className="dark:bg-[#2d3a4e] bg-[#f9f9f9] font-Poppins border-b dark:border-[#ffffff25] border-[#ddd] px-3 py-2"
              key={index}
            >
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold text-black dark:text-white">{item.title}</p>
                <button
                  onClick={() => handleNotificationStatusChange(item._id)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Mark as read
                </button>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{item.message}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{format(item.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
