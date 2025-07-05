"use client";
import React, { useState, useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "../redux/store";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // تجنب مشاكل Hydration عبر منع التصيير حتى يتم تحميل الصفحة

  return <Provider store={store}>{children}</Provider>;
}
