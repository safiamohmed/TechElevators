"use client";
import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ChatAssistant from "../components/Route/ChatAssistant";
import { Heading } from "../utils/Heading";

const teamMembers = [
  {
    name: "Esraa Ahmed",
    role: "Backend Developer",
    email: "esraafouda@ieee.org",
    image: "/assests/e.jpg",
  },
  {
    name: "Esraa Elsayed",
    role: "Frontend Developer",
    email: "esraaelsayed2442002@gmail.com",
    image: "/assests/ee.jpg",
  },
  {
    name: "Esraa Aziz",
    role: "Backend Developer",
    email: "esraaaziz41@gmail.com",
    image: "/assests/ea.jpg",
  },
  {
    name: "Safia Mohamed",
    role: "Fullstack Developer",
    email: "safiamohamed200215@gmail.com",
    image: "/assests/sm.jpg",
  },
  {
    name: "Alyaa Hussein",
    role: "AI Developer",
    email: "alyaahussein151@gmail.com",
    image: "/assests/ah.jpg",
  },
  {
    name: "Mariam Elsayed",
    role: "Frontend Developer",
    email: "zaghlolmariam284@gmail.com",
    image: "/assests/me.jpg",
  },
  {
    name: "Mariam Abdelrahman",
    role: "AI Developer",
    email: "mariamabdelrahman852@gmail.com",
    image: "/assests/ma.jpg",
  },
];

const ContactPage = () => {
  const [open, setOpen] = useState(false);
  const [route, setRoute] = useState("Login");

  return (
    <div>
      <Heading
        title="Contact Us - TechElevators"
        description="Get in touch with the TechElevators team"
        keywords="contact, team, support"
      />
      <Header
        open={open}
        setOpen={setOpen}
        activeItem={5}
        setRoute={setRoute}
        route={route}
      />
      <div className="min-h-screen px-4 py-10 text-black dark:text-white">
        <h1 className="text-4xl font-extrabold text-center text-blue-700 dark:text-blue-400 mb-10">
          Contact Our Team
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center transition transform hover:scale-105"
            >
              <div className="w-28 h-28 mx-auto rounded-full overflow-hidden mb-4 border-4 border-gray-300 dark:border-gray-600">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {member.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {member.role}
              </p>
              <a
                href={`mailto:${member.email}`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {member.email}
              </a>
            </div>
          ))}
        </div>
      </div>
      <Footer />
      <ChatAssistant />
    </div>
  );
};

export default ContactPage;
