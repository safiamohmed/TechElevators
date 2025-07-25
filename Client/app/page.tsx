"use client";
import React, { FC, useEffect, useState } from "react";
import Link from "next/link";
import {Heading} from "./utils/Heading";
import Header from "./components/Header";
import Hero from "./components/Route/Hero";
import Courses from "./components/Route/Courses";
import Reviews from "./components/Route/Reviews";
import Footer from "./components/Footer";
import ChatAssistant from "./components/Route/ChatAssistant";

interface Props {}

const Page: FC<Props> = (props) => {
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(0);
  const [route, setRoute] = useState("Login");

  return (
    <div>
      <Heading
        title="TechElevators"
        description="TechElevators is a platform for students to learn and get help from teachers"
        keywords="Prograaming,MERN,Redux,Machine Learning"
      />
      <Header
        open={open}
        setOpen={setOpen}
        activeItem={activeItem}
        setRoute={setRoute}
        route={route}
      />
      <Hero />
      <Courses />
      <Reviews />
      <br/>
      
      <br/>
      <br/>
      <br/>
      
      <Footer />
      <ChatAssistant /> {/* إضافة مكون الشات هنا */}
    </div>
  );
};

export default Page;
