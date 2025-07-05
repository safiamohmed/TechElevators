import React, { useEffect, useState } from "react";
import "./Loader.css";

const Loader = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // تأجيل التصيير حتى يكون في الـ Client فقط

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="loader"></div>
    </div>
  );
};

export default Loader;
