import { NextRequest } from "next/server";  // Use NextRequest from next/server
import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";
const { Client } = require('@notionhq/client');

export async function GET(request: NextRequest) {  // Change to NextRequest
  const url = request.nextUrl;  // This is the URL object from Next.js
  const id = url.searchParams.get("id");
  
  if (!id || Array.isArray(id)) {
    return NextResponse.json({ error: "Missing or invalid id parameter" });
  }

  try {
    // Simulate a database check (or use your Firebase admin SDK to query your database)
    const userRef = adminDB.collection("users").doc(id.toString());  // Assuming "users" is your collection name

    const doc = await userRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "User not found" });
    }

    const notionData = doc.data()?.notion;  // Ensure that data is not undefined
    if (!notionData || !notionData.accessToken) {
      return NextResponse.json({ error: "Notion access token not found" });
    }

    const notionKey = notionData.accessToken;
    const notion = new Client({ auth: notionKey });

    try {
      // Make the request to the Notion API to verify the connection
      const response = await notion.search({
        query: '',  // Empty query will fetch pages
        filter: {
          value: 'page',
          property: 'object'
        },
        sort: {
          direction: 'descending',  // Get the most recent first
          timestamp: 'last_edited_time'
        },
      });

      if (response.results.length === 0) {
        return NextResponse.json({ error: "No pages found." });
      }

      const mostRecentPage = response.results[0];

      // Get the name and last edited date of the most recent page
      const pageName = mostRecentPage.properties.title.title[0]?.text.content || 'Untitled Page';
      const lastEditedDate = mostRecentPage.last_edited_time;

      return NextResponse.json({
        isConnected: true,
        name: pageName,
        lastEditedDate,
      });

    } catch (error) {
      console.error("Error fetching Notion content:", error);
      return NextResponse.json({ isConnected: false, error: "Failed to fetch Notion data." });
    }

  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ isConnected: false, error: "Internal Server Error" });
  }
}
