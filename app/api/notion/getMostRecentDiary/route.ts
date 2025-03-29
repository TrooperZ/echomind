import { NextRequest } from "next/server";  // Use NextRequest from next/server
import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";
const { Client } = require('@notionhq/client');

export async function GET(request: NextRequest) {  // Change to NextRequest
	const url = request.nextUrl; // This is the URL object from Next.js
	const id = url.searchParams.get("id");
	if (!id || Array.isArray(id)) {
		return NextResponse.json({ error: "Missing or invalid id parameter" });
	}

	try {
		// Simulate a database check (or use your Firebase admin SDK to query your database)
		const userRef = adminDB.collection("users").doc(id.toString()); // Assuming "users" is your collection name

		const doc = await userRef.get();

		// Ensure the document exists and has notion data
		if (!doc.exists) {
			return NextResponse.json({ error: "User not found" });
		}

		const notionData = doc.data()?.notion;
		if (!notionData || !notionData.accessToken) {
			return NextResponse.json({ error: "Notion access token not found" });
		}

		const notionKey = notionData.accessToken;
		const notion = new Client({ auth: notionKey });

		try {
			// Make the request to the Notion API to search for pages with 'EchoMind'
			const response = await notion.search({
				query: 'EchoMind',  // Changed to "EchoMind"
				filter: {
				  value: 'page',
				  property: 'object'
				},
				sort: {
				  direction: 'descending',  // Adjusted to get the most recent first
				  timestamp: 'last_edited_time'
				},
			});

			if (response.results.length === 0) {
				return NextResponse.json({ error: "No pages found with the specified query." });
			}

			// Get the ID of the most recent page
			const uuid = response.results[0].id;

			// Fetch the content of the page
			const targetPage = await notion.blocks.children.list({ block_id: uuid, page_size: 50 });

			// Collect the text content from the blocks
			let finalString = "";
			for (let i = 0; i < targetPage.results.length; i++) {
				const block = targetPage.results[i];

				// Log the block for debugging

				// Check if the block is a paragraph and has rich_text
				if (block.type === 'paragraph' && block.paragraph.rich_text) {
					block.paragraph.rich_text.forEach((textObj: any) => {
						if (textObj.text && textObj.text.content) {
							finalString += textObj.text.content + " "; // Append text content
						}
					});
				}
			}

			// Log the final string to check what's being collected
			if (finalString.length > 3000) {
				finalString = finalString.slice(0, 3000);
			}

			// Send the final text as the response
			if (finalString) {
				return NextResponse.json({ content: finalString });
			} else {
				return NextResponse.json({ error: "No text content found in the page." });
			}

		} catch (error) {
			console.error("Error fetching Notion content:", error);
			return NextResponse.json({ error: "Internal Server Error" });
		}

	} catch (error) {
		console.error("Error fetching user data:", error);
		return NextResponse.json({ error: "Internal Server Error" });
	}
}
