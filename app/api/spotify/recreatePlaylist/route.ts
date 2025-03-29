import { NextRequest } from "next/server";  // Use NextRequest
import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";
type PlaylistsKeys = "happy" | "sad" | "motivated" | "neutral" | "angry" | "love" | "stressed";
const playlists = {
  happy: { id: "6uXU0VbDIFmk8G1HHqxhHz", weight: 0 },
  sad: { id: "7I1fWpXo3KSduegMH6UFM6", weight: 0 },
  motivated: { id: "38hL1KcGcICtk8BabVTxqf", weight: 0 },
  neutral: { id: "4MkJrSBcwzeFN5r3BCxgsG", weight: 0 },
  angry: { id: "0H6dtJ1XKSkHoXwxtkL6AV", weight: 0 },
  love: { id: "469t3dnz36kUPxBpvMcZVI", weight: 0 },
  stressed: { id: "44jmGoSPn97u6mEvympHQB", weight: 0 },
};

const spotifyAPI = "https://api.spotify.com/v1";

export async function POST(request: NextRequest) {
  const { emotionAnalysis, userId } = await request.json();

  // Validate the emotion analysis and userId data
  if (!emotionAnalysis || !userId) {
    return NextResponse.json(
      { response: "Missing emotion analysis or userId" },
      { status: 400 }
    );
  }

  // Print the emotion analysis data to the console
  console.log("Received emotion analysis:", emotionAnalysis);

  for (const emotion in emotionAnalysis) {
    if (emotionAnalysis.hasOwnProperty(emotion)) {
      const score = emotionAnalysis[emotion];
      const newWeight = score / 100;

      // Use type assertion here
      if (emotion in playlists) {
        (playlists[emotion as PlaylistsKeys]).weight = newWeight;
      }
    }
  }

  try {
    // Fetch user data from Firestore
    const userRef = adminDB.collection("users").doc(userId.toString());
    const doc = await userRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ response: "User not found" });
    }
    
    const userData = doc.data();  // Store the result of doc.data() in a variable
    
    // Ensure userData is not undefined before accessing its properties
    if (!userData) {
      return NextResponse.json({ response: "User data is undefined" });
    }

    const userSpotifyToken = userData.accessToken;
    const userName = userData.name;
    const targetPlaylistId = userData.targetPlaylist; // Get the target playlist ID
    const lastGenerated = userData.lastGenerated_brandNew;

    await userRef.set(
      {
        lastGenerated_brandNew: Date.now(),
      },
      { merge: true }
    );

    if (!userSpotifyToken)
      return NextResponse.json({ error: "Missing access token" });

    // Fetch tracks from playlists
    let allTracks: { id: string; playlist: string }[] = [];
    for (const [key, { id: playlistId }] of Object.entries(playlists)) {
      const response = await fetch(
        `${spotifyAPI}/playlists/${playlistId}/tracks`,
        {
          headers: { Authorization: `Bearer ${userSpotifyToken}` },
        }
      );

      if (!response.ok) {
        console.error(
          `Error fetching playlist ${key}: ${response.statusText}`
        );
        continue;
      }

      const data = await response.json();
	  type Track = {
		id: string;
		playlist: string;
	  };
	  
	  // In your existing function, update the mapping
	  const tracks = data.items
		.map((item: any) => ({
		  id: item.track.id,
		  playlist: key, // Track which playlist it came from
		}))
		.filter((track: Track) => track.id); // Filter by track.id
      allTracks = allTracks.concat(tracks);
    }

    if (allTracks.length === 0) {
      return NextResponse.json({ error: "No tracks found" });
    }

    // Weighted sampling function
    function weightedRandomSelection(count: number) {
      const weightedTracks: { id: string }[] = [];

	  type Track = {
		id: string;
		playlist: PlaylistsKeys; // Use PlaylistsKeys here
	  };
	  
	  const allTracks: Track[] = []; // Type the allTracks array accordingly
	  
	  // In the weighted random selection function
	  for (const track of allTracks) {
		const weight = playlists[track.playlist].weight; // Now TypeScript knows that track.playlist is a valid key
		for (let i = 0; i < weight * 100; i++) {
		  weightedTracks.push({ id: track.id });
		}
	  }

      const selectedTracks = new Set<string>();
      while (selectedTracks.size < count && weightedTracks.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * weightedTracks.length
        );
        selectedTracks.add(weightedTracks[randomIndex].id);
      }

      return Array.from(selectedTracks);
    }

    // Select random weighted tracks
    const randomTracks = Math.floor(Math.random() * 30) + 30;
    const selectedTracks = weightedRandomSelection(randomTracks);

    const createPlaylistResponse = await fetch(
      `${spotifyAPI}/users/${userId}/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userSpotifyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Today's EchoMind Playlist for " + userName,
          description: "A playlist created from multiple moods!",
          public: false,
        }),
      }
    );

    if (!createPlaylistResponse.ok) {
      return NextResponse.json({ error: "Failed to create playlist" });
    }

    const playlistData = await createPlaylistResponse.json();
    const newPlaylistId = playlistData.id;
    console.log("Created Playlist ID:", newPlaylistId);

    // Update Firestore with the new playlist ID
    await userRef.set(
      {
        targetPlaylist: newPlaylistId,
      },
      { merge: true }
    );

    // Add selected tracks to the newly created playlist
    const addTracksResponse = await fetch(
      `${spotifyAPI}/playlists/${newPlaylistId}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userSpotifyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: selectedTracks.map(
            (trackId) => `spotify:track:${trackId}`
          ),
        }),
      }
    );

    if (!addTracksResponse.ok) {
      return NextResponse.json({
        error: "Failed to add tracks to playlist",
      });
    }

    return NextResponse.json({
      response: "Playlist created successfully!",
      playlistId: newPlaylistId,
      emotions: emotionAnalysis,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" });
  }
}
