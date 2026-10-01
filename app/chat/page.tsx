"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type SearchResult = {
  title: string;
  text: string;
  context: string;
  score: number;
};

function ChatContent() {
  const searchParams = useSearchParams();
  const question = searchParams.get("q") || "";

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function searchNotion() {
      if (!question) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(question)}`
        );

        const data = await response.json();

        if (data.success) {
          setResults(data.results || []);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    searchNotion();
  }, [question]);

  // 표 결과가 있다면 표 결과를 우선 사용
  const bestResult = results[0];

  function renderAnswer(result: SearchResult) {
    const isTable =
      result.context.includes("|") &&
      result.text.includes("|");

    if (!isTable) {
  const lines = result.text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <p
          key={index}
          className="text-[17px] leading-8 text-gray-800"
        >
          {line}
        </p>
      ))}
    </div>
  );
}

    const headers = result.context
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);

    const cells = result.text
      .split("|")
      .map((item) => item.trim());

    const label = cells[0];
    const values = cells.slice(1);

    return (
      <div>
        <h2 className="mb-6 text-2xl font-semibold text-gray-900">
          {label}
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {headers.map((header, index) => (
            <div
              key={`${header}-${index}`}
              className="rounded-2xl bg-gray-50 p-5"
            >
              <div className="mb-2 text-sm text-gray-500">
                {header}
              </div>

              <div className="text-lg font-semibold text-gray-900">
                {values[index] || "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00462A] font-semibold text-white">
              E
            </div>

            <div>
              <div className="font-semibold">EWHA</div>
              <div className="text-xs text-gray-500">
                Exchange Student Assistant
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            New chat
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {question && (
          <div className="mb-10 flex justify-end">
            <div className="max-w-[80%] rounded-3xl bg-gray-100 px-5 py-3 leading-7">
              {question}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00462A] text-sm font-semibold text-white">
            E
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-4 text-sm font-semibold">
              Ewha Assistant
            </div>

            {loading ? (
              <p className="text-gray-500">
                Searching Ewha resources...
              </p>
            ) : bestResult ? (
              <div className="rounded-3xl border border-gray-200 p-6">
                {renderAnswer(bestResult)}

                <div className="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-500">
                  Source: {bestResult.title}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-gray-200 p-6">
                <p className="leading-7 text-gray-700">
                  I couldn&apos;t find this information in the
                  provided Ewha Exchange resources.
                </p>
              </div>
            )}

            <div className="mt-5 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-[#00462A]">
              Ewha resources
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white p-10">
          Loading...
        </main>
      }
    >
      <ChatContent />
    </Suspense>
  );
}