"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const [question, setQuestion] = useState("");
  const router = useRouter();

  const startChat = () => {
    if (!question.trim()) return;

    router.push(`/chat?q=${encodeURIComponent(question)}`);
  };
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00664F] text-sm font-semibold text-white">
            E
          </div>

          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide text-[#00664F]">
              EWHA
            </p>
            <p className="text-xs text-gray-400">
              Exchange Student Assistant
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-7 text-sm text-gray-500">
  <button
    onClick={() =>
      document.getElementById("resources")?.scrollIntoView({
        behavior: "smooth",
      })
    }
    className="transition hover:text-[#00664F]"
  >
    Resources
  </button>

  <button
  onClick={() =>
    document.getElementById("about")?.scrollIntoView({
      behavior: "smooth",
    })
  }
  className="transition hover:text-[#00664F]"
>
  About
</button>
</nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-24 pt-24 text-center md:pt-32">

        <p className="mb-7 text-xs font-semibold tracking-[0.2em] text-[#00664F]">
          EWHA EXCHANGE STUDENT ASSISTANT
        </p>

        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-[#111111] md:text-7xl">
          Everything you need
          <br />
          <span className="text-[#00664F]">at Ewha.</span>
        </h1>

        <p className="mt-7 max-w-xl text-base leading-7 text-gray-500 md:text-lg">
          Courses, housing, visas and campus life.
          <br />
          Ask a question and find what you need.
        </p>

        {/* Search */}
        <div className="mt-12 flex w-full max-w-2xl items-center rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition focus-within:border-[#00664F]">
          <input
  type="text"
  value={question}
  onChange={(e) => setQuestion(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") startChat();
  }}
  placeholder="Ask anything about Ewha..."
  className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base outline-none placeholder:text-gray-400"
/>

          <button
          onClick={startChat}
            aria-label="Send question"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00664F] text-lg text-white transition hover:bg-[#005440]"
          >
            ↑
          </button>
        </div>

        {/* Topics */}
        <div id="resources" className="mt-16 w-full max-w-3xl">
          <p className="mb-5 text-xs font-medium tracking-widest text-gray-400">
            EXPLORE
          </p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

            <button
  onClick={() => router.push("/chat?q=courses")}
  className="rounded-2xl bg-[#F7F7F7] px-4 py-5 text-left transition hover:bg-[#F0F5F3]"
>
              <span className="text-xl">📚</span>
              <p className="mt-3 text-sm font-medium">
                Courses
              </p>
            </button>

            <button
  onClick={() => router.push("/chat?q=housing")}
  className="rounded-2xl bg-[#F7F7F7] px-4 py-5 text-left transition hover:bg-[#F0F5F3]"
>
              <span className="text-xl">🏠</span>
              <p className="mt-3 text-sm font-medium">
                Housing
              </p>
            </button>

            <button
  onClick={() => router.push("/chat?q=visa")}
  className="rounded-2xl bg-[#F7F7F7] px-4 py-5 text-left transition hover:bg-[#F0F5F3]"
>
              <span className="text-xl">🛂</span>
              <p className="mt-3 text-sm font-medium">
                Visa & ARC
              </p>
            </button>

            <button
  onClick={() => router.push("/chat?q=campus life")}
  className="rounded-2xl bg-[#F7F7F7] px-4 py-5 text-left transition hover:bg-[#F0F5F3]"
>
              <span className="text-xl">🌿</span>
              <p className="mt-3 text-sm font-medium">
                Campus Life
              </p>
            </button>

          </div>
        </div>

        {/* Trust indicator */}
        <div className="mt-14 flex items-center gap-2 text-xs text-gray-400">
          <span className="h-2 w-2 rounded-full bg-[#00664F]"></span>
          Answers grounded in Ewha resources
        </div>
        {/* About */}
<div id="about" className="mt-24 max-w-2xl pb-20 text-center">
  <p className="text-sm font-medium text-[#00664F]">ABOUT</p>

  <h2 className="mt-3 text-2xl font-semibold text-gray-900">
    Made for Ewha exchange students.
  </h2>

  <p className="mt-4 leading-7 text-gray-500">
    Find essential information about courses, housing, visas, and campus life
    from curated Ewha Exchange resources.
  </p>
</div>

      </section>
    </main>
  );
}