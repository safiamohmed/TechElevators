"use client";
import React, { useState } from "react";
import {Heading} from "../utils/Heading";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ChatAssistant from "../components/Route/ChatAssistant";

import Blog from "./Blog";

type Props = {};

const Page = (props: Props) => {
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(4);
  const [route, setRoute] = useState("Login");

  return (
    <div>
      <Heading
        title="Blog - TechElevators"
        description="TechElevators is a learning management system for helping programmers."
        keywords="programming,mern"
      />
      <Header
        open={open}
        setOpen={setOpen}
        activeItem={activeItem}
        setRoute={setRoute}
        route={route}
      />
      <Blog />
      <Footer />
      <ChatAssistant /> {/* إضافة مكون الشات هنا */}
    </div>
  );
};

export default Page;