"use client";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";

export const navItemsData = [
  { name: "Home", url: "/" },
  { name: "Courses", url: "/courses" },
  { name: "About", url: "/about" },
  { name: "FAQ", url: "/faq" },
  { name: "Blog", url: "/blog" },
 // { name: "Contact", url: "/contact" },
];

type Props = {
  isMobile: boolean;
  activeItem: number;
};

const NavItems: React.FC<Props> = ({ isMobile }) => {
  const pathname = usePathname();

  return (
    <>
      {/* سطح المكتب */}
      <div className="hidden 800px:flex space-x-6">
        {navItemsData.map((item, index) => (
          <Link key={index} href={item.url} passHref>
            <span
              className={`${
                pathname === item.url
                  ? "text-[#6366F1]" // مميز للرابط الحالي
                  : "text-black dark:text-white"
              } text-[18px] font-Poppins font-[400] cursor-pointer transition-colors duration-300`}
            >
              {item.name}
            </span>
          </Link>
        ))}
      </div>

      {/* الهاتف */}
      {isMobile && (
        <div className="800px:hidden mt-5">
          <div className="w-full text-center py-6">
            <Link href={"/"} passHref>
              <span className="text-[25px] font-Poppins font-[500] text-black dark:text-white">
                TechElevators
              </span>
            </Link>
          </div>
          {navItemsData.map((item, index) => (
            <Link key={index} href={item.url} passHref>
              <span
                className={`${
                  pathname === item.url
                    ? "text-[#6366F1]"
                    : "text-black dark:text-white"
                } block py-5 text-[18px] px-6 font-Poppins font-[400] transition-colors duration-300`}
              >
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

export default NavItems;
