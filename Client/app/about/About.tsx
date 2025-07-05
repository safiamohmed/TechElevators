import React from "react";
import Image from "next/image";

const About = () => {
  return (
    <div className="text-black dark:text-white">
      <div className="max-w-6xl mx-auto">
        {/* About Us Section */}
        <section className="mb-12">
          <br></br>
          <br></br>
          <h1 className="text-4xl font-bold text-center mb-6">
            About <span className="text-gradient">TechElevators</span>
          </h1>
          <p className="text-lg leading-8 text-center">
            Tech Elevators is a revolutionary E-learning platform designed to
            empower students with personalized and engaging learning experiences
            while simplifying course management for instructors. By integrating
            cutting-edge AI technology, Stella Learn transforms education into a
            dynamic, interactive, and data-driven journey for all users.
          </p>
        </section>

        {/* Our Mission Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="flex items-center justify-center">
            <Image
              src={require("../../public/assests/rb_23713.png")}
              width={1000}
              height={1000}
              alt=""
              className="object-contain 1100px:max-w-[90%] w-[90%] 1500px:max-w-[85%] h-[auto] z-[10]"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <div className="text-lg leading-8">
              <ul>
                <li>
                  Deliver personalized, adaptive learning experiences for
                  students.
                </li>
                <li>
                  Simplify teaching with tools that let instructors focus on
                  impactful content.
                </li>
                <li>
                  Leverage AI for real-time support and innovative educational
                  solutions.
                </li>
                <li>Build a collaborative community for students and educators.</li>
                <li>Enhance accessibility to quality education worldwide.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Story</h2>
            <p className="text-lg leading-8">
              We are engineering students specializing in Systems and Computing
              who decided to create an educational platform for our graduation
              project. Our goal is to design a user-friendly platform that
              simplifies learning and teaching for students and educators alike.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <Image
              src={require("../../public/assests/rb_23710.png")}
              width={1000}
              height={1000}
              alt=""
              className="object-contain 1100px:max-w-[90%] w-[90%] 1500px:max-w-[85%] h-[auto] z-[10]"
            />
          </div>
        </section>

        {/* Founders Section */}
        <section className="text-center mt-12">
          <h3 className="text-2xl font-semibold mb-4">Meet the Founders</h3>
          <p className="text-lg">
          TechElevators is led by a team of dedicated professionals passionate
            about education and technology. Together, they aim to inspire and
            empower learners worldwide.
          </p>
        </section>
        <br></br>
        <br></br>
        <br></br>
      </div>
    </div>
  );
};

export default About;
