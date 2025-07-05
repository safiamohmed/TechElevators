import Image from "next/image";
import React, { FC } from "react";
import avatarDefault from "../../../public/assests/avatar.png";
import { RiLockPasswordLine } from "react-icons/ri";
import { SiCoursera } from "react-icons/si";
import { AiOutlineLogout } from "react-icons/ai";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import Link from "next/link";

type Props = {
  user: any;
  active: number;
  avatar: string | null;
  setActive: (active: number) => void;
  logOutHandler: any;
};

const SideBarProfile: FC<Props> = ({
  user,
  active,
  avatar,
  setActive,
  logOutHandler,
}) => {
  return (
    <div className="w-full bg-white dark:bg-gray-900 shadow-md rounded-lg p-4 flex flex-col h-full">
      <div className="flex flex-col items-center border-b pb-4">
        <Image
          src={
            user.avatar || avatar ? user.avatar.url || avatar : avatarDefault
          }
          alt=""
          width={60}
          height={60}
          className="w-[60px] h-[60px] rounded-full border-2 border-blue-400"
        />
        <h5 className="mt-2 text-lg font-semibold text-black dark:text-white">
          {user.name || "User"}
        </h5>
      </div>

      <div className="mt-4 space-y-3">
        <div
          className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
            active === 1
              ? "bg-gradient-to-r from-blue-400 to-purple-500"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          onClick={() => setActive(1)}
        >
          <FaUserCircle
            size={20}
            className={`mr-2 ${active === 1 ? "text-white" : "text-black dark:text-white"}`}
          />
          <h5
            className={`ml-2 ${
              active === 1 ? "text-white" : "text-black dark:text-white"
            }`}
          >
            My Profile
          </h5>
        </div>

        <div
          className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
            active === 2
              ? "bg-gradient-to-r from-blue-400 to-purple-500"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          onClick={() => setActive(2)}
        >
          <RiLockPasswordLine
            size={20}
            className={`mr-2 ${active === 2 ? "text-white" : "text-black dark:text-white"}`}
          />
          <h5
            className={`ml-2 ${
              active === 2 ? "text-white" : "text-black dark:text-white"
            }`}
          >
            Change Password
          </h5>
        </div>

        <div
          className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
            active === 3
              ? "bg-gradient-to-r from-blue-400 to-purple-500"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          onClick={() => setActive(3)}
        >
          <SiCoursera
            size={20}
            className={`mr-2 ${active === 3 ? "text-white" : "text-black dark:text-white"}`}
          />
          <h5
            className={`ml-2 ${
              active === 3 ? "text-white" : "text-black dark:text-white"
            }`}
          >
            Enrolled Courses
          </h5>
        </div>

        {user.role === "admin" && (
          <Link
            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
              active === 6
                ? "bg-gradient-to-r from-blue-400 to-purple-500"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            href={"/admin"}
          >
            <MdOutlineAdminPanelSettings
              size={20}
              className={`mr-2 ${active === 6 ? "text-white" : "text-black dark:text-white"}`}
            />
            <h5
              className={`ml-2 ${
                active === 6 ? "text-white" : "text-black dark:text-white"
              }`}
            >
              Admin Dashboard
            </h5>
          </Link>
        )}

        <div
          className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
            active === 4
              ? "bg-red-500 text-white"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          onClick={() => logOutHandler()}
        >
          <AiOutlineLogout
            size={20}
            className={`mr-2 ${active === 4 ? "text-white" : "text-black dark:text-white"}`}
          />
          <h5
            className={`ml-2 ${
              active === 4 ? "text-white" : "text-black dark:text-white"
            }`}
          >
            Log Out
          </h5>
        </div>
      </div>
    </div>
  );
};

export default SideBarProfile;
