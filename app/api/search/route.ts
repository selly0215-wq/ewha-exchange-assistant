import { Client } from "@notionhq/client";
import { NextRequest, NextResponse } from "next/server";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "am",
  "do", "does", "did", "can", "could",
  "i", "you", "we", "they", "it",
  "my", "your", "our", "their",
  "to", "of", "for", "in", "on", "at",
  "and", "or", "with", "about",
  "how", "what", "when", "where", "who",
]);
const SYNONYMS: Record<string, string[]> = {
  eligible: ["eligibility"],
  eligibility: ["eligible"],
  dorm: ["dormitory"],
  dormitory: ["dorm"],
  visa: ["residence"],
  residence: ["visa"],
  class: ["course"],
  classes: ["courses"],
  course: ["class"],
  courses: ["classes"],
  register: ["registration"],
  registration: ["register"],
  grade: ["grades"],
  grades: ["grade"],
};

function makeKeywords(question: string) {
  const basicKeywords = question
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 1 &&
        !STOP_WORDS.has(word)
    );

  const expandedKeywords = basicKeywords.flatMap((word) => [
    word,
    ...(SYNONYMS[word] || []),
  ]);

  return [...new Set(expandedKeywords)];
}

function getTextFromBlock(block: any) {
  const data = block[block.type];

  if (!data?.rich_text) return "";

  return data.rich_text
    .map((text: any) => text.plain_text)
    .join("");
}

// 표의 헤더 + 각 행을 하나의 검색 조각으로 만들기
async function getTableChunks(blockId: string) {
  const response = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100,
  });

  const rows = response.results
    .filter((row: any) => row.type === "table_row")
    .map((row: any) =>
      row.table_row.cells.map((cell: any[]) =>
        cell.map((text: any) => text.plain_text).join("")
      )
    );

  if (rows.length === 0) {
    return [];
  }

  const header = rows[0];

  return rows.slice(1).map((row: string[]) => ({
  searchText:
    `${header.join(" | ")} | ${row.join(" | ")}`,

  displayText: row.join(" | "),
context: header.join(" | "),
kind: "table" as const,
}));
}

async function getPageChunks(pageId: string) {
  const response = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  });

  const chunks: {
  searchText: string;
  displayText: string;
  context: string;
  kind: "section" | "table";
}[] = [];

  let currentHeading = "";
  let sectionLines: string[] = [];
  let skippingTableOfContents = false;

  function saveSection() {
  if (sectionLines.length === 0) return;

  if (currentHeading.toLowerCase() === "on this page") {
  sectionLines = [];
  return;
}

  let normalLines: string[] = [];

  function saveNormalLines() {
    if (normalLines.length === 0) return;

    const text = normalLines.join("\n");

    chunks.push({
      searchText: `${currentHeading} ${text}`.trim(),
      displayText: text,
      context: currentHeading || text,
      kind: "section",
    });

    normalLines = [];
  }

  for (let i = 0; i < sectionLines.length; i++) {
    const line = sectionLines[i];

    if (/^Q\d+\./i.test(line)) {
      saveNormalLines();

      const answer = sectionLines[i + 1] || "";

      if (/^A\d+\./i.test(answer)) {
        chunks.push({
          searchText: `${currentHeading} ${line} ${answer}`,
          displayText: answer.replace(/^A\d+\.\s*/i, ""),
          context: line,
          kind: "section",
        });

        i++;
        continue;
      }
    }

    normalLines.push(line);
  }

  saveNormalLines();
  sectionLines = [];
}

  for (const block of response.results as any[]) {
    
    const isHeading =
      block.type === "heading_1" ||
      block.type === "heading_2" ||
      block.type === "heading_3";

    if (isHeading) {
      saveSection();
      currentHeading = getTextFromBlock(block);
      continue;
    }

    if (block.type === "table") {
      saveSection();

      const tableChunks = await getTableChunks(block.id);
      chunks.push(...tableChunks);
      continue;
    }

    const text = getTextFromBlock(block);

if (text) {
  const cleanText = text.trim();

  if (cleanText.toLowerCase() === "on this page") {
    skippingTableOfContents = true;
    continue;
  }

  if (
    skippingTableOfContents &&
    cleanText.toLowerCase() === "part-time employment"
  ) {
    skippingTableOfContents = false;
    continue;
  }

  if (skippingTableOfContents) {
    continue;
  }

  sectionLines.push(cleanText);
}
  }

  saveSection();

  return chunks;
}

let searchCache: {
  data: {
    title: string;
    chunks: {
      searchText: string;
      displayText: string;
      context: string;
      kind: "section" | "table";
    }[];
  }[];
  savedAt: number;
} | null = null;

const CACHE_TIME = 10 * 60 * 1000;
export async function GET(request: NextRequest) {
  try {
    const question =
      request.nextUrl.searchParams.get("q")?.trim() || "";

    if (!question) {
      return NextResponse.json({
        success: false,
        message: "Please enter a question.",
      });
    }

    const mainPageId = process.env.NOTION_PAGE_ID;

    if (!mainPageId) {
      return NextResponse.json(
        {
          success: false,
          message: "NOTION_PAGE_ID is missing.",
        },
        { status: 500 }
      );
    }

    const keywords = makeKeywords(question);

   const mainPage = await notion.blocks.children.list({
  block_id: mainPageId,
  page_size: 100,
});

const childPages = mainPage.results.filter(
  (block: any) => block.type === "child_page"
) as any[];

    const matches: {
  title: string;
  text: string;
  context: string;
  score: number;
}[] = [];

    for (const page of childPages) {
  const title = page.child_page.title;
  const chunks = await getPageChunks(page.id);

      for (const chunk of chunks) {
        const searchLower = chunk.searchText.toLowerCase();

        let score = 0;
        const contextLower = chunk.context.toLowerCase();

if (
  chunk.kind === "section" &&
  keywords.some(
    (keyword) =>
      keyword.length >= 6 &&
      contextLower.includes(keyword)
  )
) {
  score += 2;
}
        

        for (const keyword of keywords) {
  if (searchLower.includes(keyword)) {
    score += 1;
  }
}

// 섹션 제목이 질문의 핵심 단어와 맞으면 가장 우선
if (chunk.kind === "section") {
  const headingLower = chunk.context.toLowerCase();

  if (
    (keywords.includes("eligible") ||
      keywords.includes("eligibility")) &&
    headingLower.includes("eligibility")
  ) {
    score += 5;
  }
}
if (
  (keywords.includes("course") ||
    keywords.includes("courses") ||
    keywords.includes("class") ||
    keywords.includes("classes")) &&
  (keywords.includes("register") ||
    keywords.includes("registration")) &&
  title.toLowerCase().includes("course registration")
) {
  score += 5;
}

if (
  keywords.includes("visa") &&
  chunk.kind === "section" &&
  chunk.context.toLowerCase().includes("applying for a visa")
) {
  score += 5;
}
if (
  keywords.includes("visa") &&
  keywords.includes("documents") &&
  chunk.kind === "section" &&
  chunk.context.toLowerCase().includes("applying for a visa") &&
  searchLower.includes("visa application form")
) {
  score += 5;
}

if (
  chunk.kind === "table" &&
  keywords.includes("dormitory") &&
  keywords.includes("fee") &&
  searchLower.includes("dormitory fee")
) {
  score += 5;
}

if (score >= 2) {
  matches.push({
    title,
    text: chunk.displayText,
    context: chunk.context,
    score,
  });
}
      }
    }

    matches.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      question,
      keywords,
      results: matches.slice(0, 20),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}