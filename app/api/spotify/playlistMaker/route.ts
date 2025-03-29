import { NextRequest } from "next/server";  // Use NextRequest from next/server
import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";

const playlists = {
  happy: { id: "6uXU0VbDIFmk8G1HHqxhHz", weight: 0 },
  sad: { id: "7I1fWpXo3KSduegMH6UFM6", weight: 0 },
  motivated: { id: "38hL1KcGcICtk8BabVTxqf", weight: 0 },
  neutral: { id: "4MkJrSBcwzeFN5r3BCxgsG", weight: 0 },
  angry: { id: "0H6dtJ1XKSkHoXwxtkL6AV", weight: 0 },
  love: { id: "469t3dnz36kUPxBpvMcZVI", weight: 0 },
  stressed: { id: "44jmGoSPn97u6mEvympHQB", weight: 0 },
}; // `as const` ensures the keys are literal types

type PlaylistsKeys = keyof typeof playlists;  // "happy" | "sad" | "motivated" | ...

const spotifyAPI = "https://api.spotify.com/v1";

export async function POST(request: NextRequest) {  // Use NextRequest here
  const { emotionAnalysis, userId } = await request.json();

  // Validate the emotion analysis and userId data
  if (!emotionAnalysis || !userId) {
    return NextResponse.json({ error: "Missing emotion analysis or userId" }, { status: 400 });
  }

  // Print the emotion analysis data to the console
  console.log("Received emotion analysis:", emotionAnalysis);

  for (const emotion in emotionAnalysis) {
    if (emotionAnalysis.hasOwnProperty(emotion)) {
      // Type check to ensure `emotion` is a valid key of the `playlists` object
      if (emotion in playlists) {
        const score = emotionAnalysis[emotion as PlaylistsKeys];
        const newWeight = score / 100;

        // Update the playlist weight
        playlists[emotion as PlaylistsKeys].weight = newWeight;
      }
    }
  }

  try {
    // Fetch user data from Firestore
    const userRef = adminDB.collection("users").doc(userId.toString());
    const doc = await userRef.get();
    if (!doc.exists) return NextResponse.json({ error: "User not found" });

    const userSpotifyToken = doc.data()?.accessToken;
    const userName = doc.data()?.name;
    const targetPlaylistId = doc.data()?.targetPlaylist;

    const lastGenerated = doc.data()?.lastGenerated;

    // Check if the user is trying to generate too frequently
    await userRef.set(
      {
        lastGenerated: Date.now(),
      },
      { merge: true }
    );

    if (!userSpotifyToken)
      return NextResponse.json({ response: "Missing access token" });

    // Fetch tracks from playlists
    interface Track {
      id: string;
      playlist: string;
    }
    
    let allTracks: Track[] = [];
    
    for (const [key, { id: playlistId }] of Object.entries(playlists)) {
      const response = await fetch(`${spotifyAPI}/playlists/${playlistId}/tracks`, {
        headers: { Authorization: `Bearer ${userSpotifyToken}` },
      });
    
      if (!response.ok) {
        console.error(`Error fetching playlist ${key}: ${response.statusText}`);
        continue;
      }
    
      const data = await response.json();
      const tracks: Track[] = data.items
        .map((item: any) => ({
          id: item.track.id,
          playlist: key, // Track which playlist it came from
        }))
        .filter((track: Track) => track.id); // Now track is explicitly typed as Track
    
      allTracks = allTracks.concat(tracks);
    }

    if (allTracks.length === 0) {
      return NextResponse.json({ error: "No tracks found" });
    }

    // Weighted sampling function
    function weightedRandomSelection(count: number) {
      const weightedTracks: { id: string }[] = [];

      for (const track of allTracks) {
        const weight = playlists[track.playlist as PlaylistsKeys].weight;
        for (let i = 0; i < weight * 100; i++) {
          weightedTracks.push({ id: track.id });
        }
      }

      const selectedTracks = new Set<string>();
      while (selectedTracks.size < count && weightedTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * weightedTracks.length);
        selectedTracks.add(weightedTracks[randomIndex].id);
      }

      return Array.from(selectedTracks);
    }

    // Select random weighted tracks
    const randomTracks = Math.floor(Math.random() * 30) + 30;
    const selectedTracks = weightedRandomSelection(randomTracks);

    // Check if the target playlist exists on Spotify
    if (targetPlaylistId) {
      const playlistTracksResponse = await fetch(`${spotifyAPI}/playlists/${targetPlaylistId}/tracks`, {
        headers: { Authorization: `Bearer ${userSpotifyToken}` },
      });

      if (playlistTracksResponse.ok) {
        const playlistTracksData = await playlistTracksResponse.json();
        const trackUris = playlistTracksData.items.map((item: any) => item.track.uri);

        // If the playlist exists but has no tracks, create a new playlist
        if (trackUris.length === 0) {
        } else {
          // Remove all tracks from the playlist
          const removeTracksResponse = await fetch(`${spotifyAPI}/playlists/${targetPlaylistId}/tracks`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${userSpotifyToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tracks: trackUris.map((uri: string) => ({ uri })),
            }),
          });

          if (!removeTracksResponse.ok) {
            console.error("Error removing tracks from playlist:", removeTracksResponse.statusText);
          }
        }
      }
    }

    // If the playlist doesn't exist or is empty, create a new playlist
    if (!targetPlaylistId || !await fetch(`${spotifyAPI}/playlists/${targetPlaylistId}/tracks`, {
      headers: { Authorization: `Bearer ${userSpotifyToken}` },
    }).then((res) => res.ok)) {
      const createPlaylistResponse = await fetch(`${spotifyAPI}/users/${userId}/playlists`, {
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
      });

      if (!createPlaylistResponse.ok) {
        return NextResponse.json({ error: "Failed to create playlist" });
      }

      const playlistData = await createPlaylistResponse.json();
      const newPlaylistId = playlistData.id;

      // Update Firestore with the new playlist ID
      await userRef.set(
        {
          targetPlaylist: newPlaylistId,
        },
        { merge: true }
      );

      // Add selected tracks to the newly created playlist
      const addTracksResponse = await fetch(`${spotifyAPI}/playlists/${newPlaylistId}/tracks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userSpotifyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: selectedTracks.map((trackId) => `spotify:track:${trackId}`),
        }),
      });

      if (!addTracksResponse.ok) {
        return NextResponse.json({ error: "Failed to add tracks to playlist" });
      }

      return NextResponse.json({
        response: "Playlist created successfully!",
        playlistId: newPlaylistId,
      });
    } else {
      // Add selected tracks to the existing playlist
      const addTracksResponse = await fetch(`${spotifyAPI}/playlists/${targetPlaylistId}/tracks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userSpotifyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: selectedTracks.map((trackId) => `spotify:track:${trackId}`),
        }),
      });

      if (!addTracksResponse.ok) {
        return NextResponse.json({ error: "Failed to add tracks to playlist" });
      }

      return NextResponse.json({
        response: "Tracks added successfully to the existing playlist",
        playlistId: targetPlaylistId,
        emotions: emotionAnalysis,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" });
  }
}
