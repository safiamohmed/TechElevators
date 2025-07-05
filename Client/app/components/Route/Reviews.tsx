import { styles } from "@/app/styles/style";
import Image from "next/image";
import React from "react";
import ReviewCard from "../Review/ReviewCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type Props = {};

export const reviews = [
  {
    name: "Medhat Gamal",
    avatar: "/assests/mg.jpg",
    profession: "Emergency and Critical Cases Doctor",
    comment:"I recently tried the TechElevators platform, and it was one of the most effective learning experiences I’ve had. The content is well-structured and adapts to my level, making it easy to follow and stay focused. What impressed me most was the AI-powered assistant, which responds instantly to my questions with accurate and helpful answers — it really saved me time during study sessions. The platform itself is smooth, lightweight, and works great on both desktop and mobile. I also appreciated the dark mode, which made long hours of studying more comfortable. Another great feature is the smart summaries that help me quickly review and retain the key concepts. Overall, TechElevators is a powerful tool for any student looking for a smarter and more interactive way to learn."

               },
  {
    name: "Bassem Saeed",
    avatar: "/assests/bs.jpg",
    profession: "Front-End Developer | React js",
    comment:"TechElevators offers a smooth and modern e-learning experience through a clean user interface, consistent design, and responsive layout. The platform supports both dark and light modes, features an AI-powered chatbot assistant, and provides personalized user access — combining usability with intelligent functionality. With intuitive navigation, mobile optimization, and an admin control panel, it stands out as a complete and scalable learning solution.I'm genuinely happy with this excellent result — truly one of the best educational platforms I've ever used. Wishing you all the best in what’s next!"
  },
  {
    name: "Bahaa Shahein",
    avatar: "/assests/b.jpg",
    profession: "Front-End Developer | React js",
    comment:
    "I'm Bahaa Shaheen, a front-end developer specializing in React.js, and I’ve worked on many web projects. From my experience with TechElevators, I truly appreciate the platform and how well it aligns with today’s tech landscape.One of the standout features is the integration of AI, which actively supports you throughout your course. There’s also a helpful bot that guides you if you’re unsure how to use the platform — a great feature that significantly improves accessibility.What also caught my attention is the design: it’s visually comfortable, with attractive and well-balanced colors. The responsive layout is excellent, offering a smooth experience across all devices — whether you're using a phone, tablet, or desktop.Honestly, the platform deserves more than 10 stars. It delivers modern tools and features that you rarely find, even on global platforms."
},
  {
    name: "Medhat Gamal",
    avatar: "/assests/mg.jpg",
    profession: "Emergency and Critical Cases Doctor",
    comment:"I recently tried the TechElevators platform, and it was one of the most effective learning experiences I’ve had. The content is well-structured and adapts to my level, making it easy to follow and stay focused. What impressed me most was the AI-powered assistant, which responds instantly to my questions with accurate and helpful answers — it really saved me time during study sessions. The platform itself is smooth, lightweight, and works great on both desktop and mobile. I also appreciated the dark mode, which made long hours of studying more comfortable. Another great feature is the smart summaries that help me quickly review and retain the key concepts. Overall, TechElevators is a powerful tool for any student looking for a smarter and more interactive way to learn."

               },

];

const Reviews = (props: Props) => {
  return (
    <div className="w-[90%] 800px:w-[85%] m-auto">
      <div className="w-full 800px:flex items-center">
        <div className="800px:w-[50%] w-full">
       <Image
            src={require("../../../public/assests/freepik__background__46103.png")}
            alt="business"
            width={500}
            height={500}
          />
        </div>
        <div className="800px:w-[50%] w-full">
          <h3 className={`${styles.title} 800px:!text-[40px]`}>
            Our Students Are <span className="text-gradient">Our Strength</span>
            <br /> See What They Say About Us
          </h3>
          <br />
          
         
        </div>
        <br />
        <br />
      </div>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        navigation
        pagination={{ clickable: true }}
        loop={true}  
        autoplay={{ delay: 5000, disableOnInteraction: false }} 
        className="py-5"
      >
        {reviews.map((i, index) => (
          <SwiperSlide key={index}>
            <ReviewCard item={i} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Reviews;
