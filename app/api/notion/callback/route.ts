import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";
import { auth } from "@/lib/auth"

// app/api/notion/callback/route.ts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // Exchange the code for an access token
  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(
        `${process.env.AUTH_NOTION_ID}:${process.env.AUTH_NOTION_SECRET}`
      ).toString("base64")}`,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.AUTH_NOTION_REDIRECT_URI!,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data }, { status: 400 });
  }

  const { access_token, bot_id, workspace_id, workspace_name } = data;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    // Handle the case where userId is undefined
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  const userRef = adminDB.collection("users").doc(userId);

  const updatedTime = Date.now();
  const readableUpdatedTime = new Date(updatedTime).toLocaleString();

  await userRef.set(
    {
      lastUpdatedEpoch: updatedTime,
      lastUpdated: readableUpdatedTime,
      notion: {
        accessToken: access_token,
        botId: bot_id,
        workspaceId: workspace_id,
        workspaceName: workspace_name,
      },
    },
    { merge: true }
  );

  const redirectUrl = `${process.env.NEXTAUTH_URL}/dashboard`;
  
  return NextResponse.redirect(redirectUrl);
}
