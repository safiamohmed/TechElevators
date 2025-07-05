import Link from 'next/link'
import React from 'react'

type Props = {}

const Footer = (props: Props) => {
  return (
    <footer>
      <div className="border border-[#0000000e] dark:border-[#ffffff1e]" />
      <br />
      <div className="w-[95%] 800px:w-full 800px:max-w-[85%] mx-auto px-2 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-[20px] font-[600] text-black dark:text-white">About</h3>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/about"
                  className="text-base text-black dark:text-gray-300 dark:hover:text-white"
                >
                  Our Story
                </Link>
              </li>
              <li>
                
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-base text-black dark:text-gray-300 dark:hover:text-white"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-[20px] font-[600] text-black dark:text-white">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/courses"
                  className="text-base text-black dark:text-gray-300 dark:hover:text-white"
                >
                  Courses
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-base text-black dark:text-gray-300 dark:hover:text-white"
                >
                  My Account
                </Link>
              </li>
            
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-[20px] font-[600] text-black dark:text-white">Social Links</h3>
            <ul className="space-y-4">
              
              <li>
                <Link
                  href="https://www.linkedin.com/company/107747693/"
                  className="text-base text-black dark:text-gray-300 dark:hover:text-white"
                >
                  LinkedIn
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/tech-elevators"
                  className="text-base text-black dark:text-gray-300 dark:hover:text-white"
                >
                  github
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-[20px] font-[600] text-black dark:text-white pb-3">Contact Info</h3>
<Link
  href="/contact"
  className="text-base text-black dark:text-gray-300 dark:hover:text-white pb-2 block no-underline focus:outline-none"
>
  Contact Us
</Link>

            <p className="text-base text-black dark:text-gray-300 dark:hover:text-white  pb-2">
            Adress: Faculty of Engineering, Al-Azhar University
            </p>
         
<a
  href="mailto:TechElevators.help@gmail.com"
  className="text-base text-black dark:text-gray-300 dark:hover:text-white pb-2 block no-underline focus:outline-none"
>
  Mail Us: techElevators1@gmail.com
</a>

            
          </div>
        </div>
        <br />
        <p className="text-center text-black dark:text-white">
          Copyright © 2025 TechElevators | All Rights Reserved
        </p>
      </div>
      <br />
    </footer>
  )
}

export default Footer