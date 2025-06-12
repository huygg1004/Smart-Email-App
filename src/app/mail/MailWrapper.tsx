"use client";

import { UserButton } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import React from "react";
import ComposeButton from "./compose-buttont";

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((mod) => mod.ThemeToggle),
  { ssr: false },
);

const Mail = dynamic(() => import("./mail"), {
  ssr: false,
});

export default function MailWrapper() {
  return (
    <>
      <div className="absolute bottom-4 left-4 z-50">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
          <ComposeButton/>
        </div>
      </div>
      <Mail
        defaultLayout={[20, 32, 48]}
        defaultCollapsed={false}
        navCollapsedSize={4}
      />
    </>
  );
}
