
"use client";
import React, { useState } from "react";
import {Heading} from "../../utils/Heading";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import BlogPost from "./post";

type Props = {};

const Page = (props: Props) => {
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(4);
  const [route, setRoute] = useState("Login");

  return (
    <div>
      <Heading
        title="post- TechElevators"
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
      <BlogPost />
      <Footer />
    </div>
  );
};

export default Page;