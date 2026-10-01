import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// 일반 글 블록에서 글자만 꺼내는 함수
function getTextFromBlock(block: any) {
  const type = block.type;
  const data = block[type];

  if (!data?.rich_text) return "";

  return data.rich_text
    .map((text: any) => text.plain_text)
    .join("");
}

// 표 안의 내용을 읽는 함수
async function getTable(blockId: string) {
  const response = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100,
  });

  return response.results
    .filter((row: any) => row.type === "table_row")
    .map((row: any) =>
      row.table_row.cells.map((cell: any[]) =>
        cell.map((text: any) => text.plain_text).join("")
      )
    );
}

// 한 페이지 안의 글 + 표를 읽는 함수
async function readPage(pageId: string) {
  const response = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  });

  const content = [];

  for (const block of response.results as any[]) {
    if (block.type === "table") {
      const table = await getTable(block.id);

      content.push({
        type: "table",
        data: table,
      });
    } else {
      const text = getTextFromBlock(block);

      if (text) {
        content.push({
          type: block.type,
          text,
        });
      }
    }
  }

  return content;
}

export async function GET() {
  try {
    const mainPageId = process.env.NOTION_PAGE_ID;

    if (!mainPageId) {
      return NextResponse.json(
        { error: "NOTION_PAGE_ID is missing" },
        { status: 500 }
      );
    }

    // 메인 페이지의 블록 가져오기
    const mainPage = await notion.blocks.children.list({
      block_id: mainPageId,
      page_size: 100,
    });

    // 하위 페이지만 찾기
    const childPages = mainPage.results.filter(
      (block: any) => block.type === "child_page"
    ) as any[];

    // 각 하위 페이지의 실제 내용 읽기
    const pages = [];

    for (const page of childPages) {
      const content = await readPage(page.id);

      pages.push({
        id: page.id,
        title: page.child_page.title,
        content,
      });
    }

    return NextResponse.json({
      success: true,
      pages,
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