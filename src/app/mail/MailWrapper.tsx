"use client";

import dynamic from "next/dynamic";

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((mod) => mod.ThemeToggle),
  { ssr: false }
);

const Mail = dynamic(() => import("./mail"), {
  ssr: false,
});

export default function MailWrapper() {
  return (
    <>
      <div className="absolute bottom-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Mail
        defaultLayout={[20, 32, 48]}
        defaultCollapsed={false}
        navCollapsedSize={4}
      />
    </>
  );
}
