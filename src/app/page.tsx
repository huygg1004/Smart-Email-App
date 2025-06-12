import { Button } from "@/components/ui/button";
import LinkAccountButton from "@/components/link-account-button";
import AboutMeModal from "@/components/AboutMeModal";
import PrivacyModal from "@/components/PrivacyModal";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-6 text-gray-800">
      {/* Hero */}
      <section className="max-w-2xl text-center">
        <h1 className="mb-6 text-5xl font-extrabold tracking-tight">
          Welcome to Smart Inbox
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          AI-powered email client to organize, search, and respond faster. All
          your emails in one smart, private dashboard.
        </p>
        <p className="text-md mb-8 text-gray-700">
          Start by linking your Email account.
        </p>
        <LinkAccountButton />
      </section>

      {/* Features */}
      <section className="mt-16 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl bg-white p-6 shadow transition hover:shadow-lg"
          >
            <div className="mb-2 text-2xl">{feature.icon}</div>
            <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="mt-20 flex flex-col items-center text-sm text-gray-500">
        <AboutMeModal />
        <PrivacyModal />
        <span className="mt-4">
          &copy; {new Date().getFullYear()} Huy Doan. All rights reserved.
        </span>
      </footer>
    </main>
  );
}

const features = [
  {
    title: "AI Smart Replies",
    description:
      "Auto-draft replies based on context. Save time on repetitive responses.",
    icon: "🤖",
  },
  {
    title: "Semantic Search",
    description:
      "Find any email instantly with vector-based search powered by Orama.",
    icon: "🔍",
  },
  {
    title: "Privacy First",
    description:
      "Your data stays yours. Encrypted and secure email integration.",
    icon: "🔐",
  },
];
