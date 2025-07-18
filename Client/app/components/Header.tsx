"use client";
import Link from "next/link";
import React, { FC, useEffect, useState } from "react";
import NavItems from "../utils/NavItems";
import { ThemeSwitcher } from "../utils/ThemeSwitcher";
import { HiOutlineMenuAlt3, HiOutlineUserCircle } from "react-icons/hi";
import CustomModal from "../utils/CustomModel"; 
import Login from "../components/Auth/Login";
import SignUp from "../components/Auth/SignUp";
import Verification from "../components/Auth/Verification";
import ForgetPassword from "../components/Auth/ForgetPassword";
import VerifyResetCode from "./Auth/VerifyResetCode";
import ResetPassword from "./Auth/ResetPassword";
import Image from "next/image";
import avatar from "../../public/assests/avatar.png";
import { useSession } from "next-auth/react";
import { useLogOutQuery, useSocialAuthMutation } from "@/redux/features/auth/authApi";
import { toast } from "react-hot-toast";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";
import Loader from "./Loader/Loader";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeItem: number;
  route: string;
  setRoute: (route: string) => void;
};

const Header: FC<Props> = ({ activeItem, setOpen, route, open, setRoute }) => {
  const [active, setActive] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const { data: userData, isLoading, refetch } = useLoadUserQuery(undefined, {});
  const { data } = useSession();
  const [socialAuth, { isSuccess }] = useSocialAuthMutation();
  const [logout, setLogout] = useState(false);
  const [email, setEmail] = useState("");
  useLogOutQuery(undefined, { skip: !logout });

  useEffect(() => {
    if (!isLoading) {
      if (!userData && data) {
        socialAuth({
          email: data?.user?.email,
          name: data?.user?.name,
          avatar: data.user?.image,
        });
        refetch();
      }
      if (data === null && isSuccess) {
        toast.success("Login Successfully");
      }
      if (data === null && !isLoading && !userData) {
        setLogout(true);
      }
    }
  }, [data, userData, isLoading, isSuccess]);

  useEffect(() => {
    const handleScroll = () => {
      setActive(window.scrollY > 85);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClose = (e: any) => {
    if (e.target.id === "screen") {
      setOpenSidebar(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full relative">
          <div
            className={`${
              active
                ? "dark:bg-opacity-50 bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:to-black fixed top-0 left-0 w-full h-[80px] z-[80] border-b dark:border-[#ffffff1c] shadow-xl transition duration-500"
                : "w-full border-b dark:border-[#ffffff1c] h-[80px] z-[80] dark:shadow"
            }`}
          >
            <div className="w-[95%] 800px:w-[92%] m-auto py-2 h-full">
              <div className="w-full h-[80px] flex items-center justify-between p-3">
                {/* ---- */}
                <div className="flex items-center gap-2">
                  <Image
                    src={require("../../public/assests/image_2025-02-22_19-19-21.png")}
                    width={40}
                    height={40}
                    alt=""
                    className="object-contain max-w-[30%] h-auto z-10"
                  />
                  <Link
                    href="/"
                    className="text-[25px] font-Poppins font-[500] bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent pl-2"
                  >
                    TechElevators
                  </Link>
                </div>

                <div className="flex items-center">
                  <NavItems activeItem={activeItem} isMobile={false} />
                  <ThemeSwitcher />
                  <div className="800px:hidden">
                    <HiOutlineMenuAlt3
                      size={25}
                      className="cursor-pointer dark:text-white text-black"
                      onClick={() => setOpenSidebar(true)}
                    />
                  </div>
                  {userData ? (
                    <Link href={"/profile"}>
                      <Image
                        src={userData?.user.avatar ? userData.user.avatar.url : avatar}
                        alt=""
                        width={30}
                        height={30}
                        className="w-[30px] h-[30px] rounded-full cursor-pointer"
                        style={{ border: activeItem === 5 ? "2px solid #37a39a" : "none" }}
                      />
                    </Link>
                  ) : (
                    <HiOutlineUserCircle
                      size={25}
                      className="hidden 800px:block cursor-pointer dark:text-white text-black"
                      onClick={() => setOpen(true)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* mobile sidebar */}
            {openSidebar && (
              <div
                className="fixed w-full h-screen top-0 left-0 z-[99999] bg-[#00000024] pointer-events-auto"
                onClick={handleClose}
                id="screen"
              >
                <div className="w-[70%] fixed z-[999999999] h-screen bg-white dark:bg-slate-900 dark:bg-opacity-90 top-0 right-0">
                  <NavItems activeItem={activeItem} isMobile={true} />
                  {userData?.user ? (
                    <Link href={"/profile"}>
                      <Image
                        src={userData?.user.avatar ? userData.user.avatar.url : avatar}
                        alt=""
                        width={30}
                        height={30}
                        className="w-[30px] h-[30px] rounded-full ml-[20px] cursor-pointer"
                        style={{ border: activeItem === 5 ? "2px solid #37a39a" : "none" }}
                      />
                    </Link>
                  ) : (
                    <HiOutlineUserCircle
                      size={25}
                      className="hidden 800px:block cursor-pointer dark:text-white text-black"
                      onClick={() => setOpen(true)}
                    />
                  )}
                  <br />
                  <br />
                  <p className="text-[16px] px-2 pl-5 text-black dark:text-white">
                    Copyright © 2025 TechElevators
                  </p>
                </div>
              </div>
            )}
          </div>

          {open && (
            <CustomModal
              open={open}
              setOpen={setOpen}
              setRoute={setRoute}
              activeItem={activeItem}
              component={
                route === "Login"
                  ? Login
                  : route === "Sign-Up"
                  ? SignUp
                  : route === "Forget-Password"
                  ? ForgetPassword
                  : route === "Verify-Reset-Code"
                  ? VerifyResetCode // غيرنا من <VerifyResetCode email={email} setRoute={setRoute} /> لـ VerifyResetCode
                  : route === "Reset-Password"
                  ? ResetPassword // غيرنا من <ResetPassword email={email} setRoute={setRoute} /> لـ ResetPassword
                  : Verification
              }
              refetch={refetch}
              setEmail={setEmail}
              email={email}
            />
          )}
        </div>
      )}
    </>
  );
};

export default Header;