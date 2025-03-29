import { NextResponse } from "next/server";

export async function GET() {
  const notionAuthUrl = new URL("https://api.notion.com/v1/oauth/authorize");
  notionAuthUrl.searchParams.append("client_id", process.env.AUTH_NOTION_ID!);
  notionAuthUrl.searchParams.append("response_type", "code");
  notionAuthUrl.searchParams.append("owner", "user"); // or "workspace"
  notionAuthUrl.searchParams.append("redirect_uri", process.env.AUTH_NOTION_REDIRECT_URI!);

  return NextResponse.redirect(notionAuthUrl.toString());
}
