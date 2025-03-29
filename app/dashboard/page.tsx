"use client";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle, RefreshCw, Music } from "lucide-react";
import { SpotifyEmbed } from "spotify-embed";
import { ReactNode } from "react";
export default function Dashboard() {
	const { data: session, status } = useSession();
	const [isConnected, setIsConnected] = useState(0);
	const router = useRouter();
	const [addedTracks, setAddedTracks] = useState(0);
	const [rateLimitMsg, setRateLimitMsg] = useState(false);
	const [recentlyEditedName, setRecentlyEditedName] = useState("N/A");
	const [recentlyEditedDate, setRecentlyEditedDate] = useState("N/A");
	const [playlistId, setPlaylistId] = useState("");
	const [emotionData, setEmotionData] = useState({});
	const [embedKeyValue, setEmbedKeyValue] = useState(0)
	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/"); // Redirect to home if not logged in
		}
		if (session?.user?.id != undefined) {
			checkNotionConnection();
		}
	}, [status, router]);

	const playlistGenerateFromText = async () => {
		try {
			setAddedTracks(5);
			// Step 1: Fetch the most recent diary text
			const recentDiaryText = await fetch(
				`/api/notion/getMostRecentDiary?id=${session?.user?.id}`
			);
			const recentDiaryTextData = await recentDiaryText.json();

			// Step 2: Analyze the emotions from the text
			const emotionSentiments = await fetch("/api/emotionAnalyzer", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ text: recentDiaryTextData.content }),
			});

			const emotionSentimentsData = await emotionSentiments.json();

			console.log("Emotion Sentiments:", emotionSentimentsData);

			// Step 3: Create a playlist based on the emotion analysis
			const createPlaylistResponse = await fetch(
				"/api/spotify/playlistMaker",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						emotionAnalysis: emotionSentimentsData,
						userId: session?.user?.id, // Ensure the user ID is passed correctly
					}),
				}
			);

			const playlistData = await createPlaylistResponse.json();

			if (playlistData.response) {
				setAddedTracks(1);
				setRateLimitMsg(false);
				setPlaylistId(playlistData.playlistId);
				setEmotionData(playlistData.emotions);
				setEmbedKeyValue(embedKeyValue + 1)
			} else {
				if (
					playlistData.error ===
					"Generating too fast! Wait 5 mins between requests."
				) {
					setRateLimitMsg(true);
				}
				setAddedTracks(2);
			}
		} catch (error) {
			console.error("Error fetching data:", error);
		}
	};

	const playlistGenerateFromText_IFSPOTIFYBUGGED = async () => {
		try {
			setAddedTracks(5);
			// Step 1: Fetch the most recent diary text
			const recentDiaryText = await fetch(
				`/api/notion/getMostRecentDiary?id=${session?.user?.id}`
			);
			const recentDiaryTextData = await recentDiaryText.json();

			// Step 2: Analyze the emotions from the text
			const emotionSentiments = await fetch("/api/emotionAnalyzer", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ text: recentDiaryTextData.content }),
			});

			const emotionSentimentsData = await emotionSentiments.json();

			console.log("Emotion Sentiments:", emotionSentimentsData);

			// Step 3: Create a playlist based on the emotion analysis
			const createPlaylistResponse = await fetch(
				"/api/spotify/recreatePlaylist",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						emotionAnalysis: emotionSentimentsData,
						userId: session?.user?.id,
					}),
				}
			);

			const playlistData = await createPlaylistResponse.json();
			console.log(playlistData);
			if (playlistData.response) {
				setAddedTracks(1);
				setRateLimitMsg(false);
				setPlaylistId(playlistData.playlistId);
				setEmotionData(playlistData.emotions);
				setEmbedKeyValue(embedKeyValue + 1)
			} else {
				if (
					playlistData.error ===
					"Generating too fast! Wait 5 mins between requests."
				) {
					setRateLimitMsg(true);
				}
				setAddedTracks(2);
			}
		} catch (error) {
			console.error("Error fetching data:", error);
		}
	};

	const checkNotionConnection = async () => {
		try {
			const response = await fetch(
				`/api/notion/checkConnection?id=${session?.user?.id}`
			); // Call your local API here
			const data = await response.json();
			console.log(data);
			if (data.isConnected) {
				setIsConnected(data.isConnected ? 1 : 0);
				setRecentlyEditedDate(data.lastEditedDate);
				setRecentlyEditedName(data.name);
			} else {
				setIsConnected(3);
			}
		} catch (error) {
			console.error("Error fetching data:", error);
			setIsConnected(2);
		}
	};

	const checkAndCallConnect = () => {
		checkNotionConnection();
		if (isConnected != 1) {
			router.push("/api/notion/authorize");
		}
		checkNotionConnection();
	};

	if (status === "loading") return <div>Loading...</div>;

	return (
		<div className="relative flex flex-col min-h-screen bg-[#0D0D2B] text-white overflow-hidden">
			{/* Background Circles */}
			<div className="absolute top-[-50px] left-[-100px] w-[300px] h-[300px] bg-blue-500 opacity-30 rounded-full blur-3xl"></div>
			<div className="absolute bottom-[-100px] right-[-50px] w-[250px] h-[250px] bg-purple-500 opacity-30 rounded-full blur-3xl"></div>
			<div className="absolute top-[30%] left-[50%] w-[200px] h-[200px] bg-indigo-500 opacity-20 rounded-full blur-2xl"></div>

			{/* Navbar */}
			<header className="flex justify-between items-center w-full px-10 py-6 relative z-10">
				<div className="flex items-center gap-2">
					<Image
						src="/EchoMind_Logo.png"
						className="rounded-lg"
						alt="Logo"
						width={40}
						height={40}
					/>
					<span className="text-2xl font-bold pl-2">EchoMind</span>
				</div>

				<div className="flex items-center gap-4">
					<p className="text-white font-bold">
						{session?.user?.name}
					</p>
					<button
						onClick={() => signOut()}
						className=" bg-red-500 px-6 py-3 rounded-full text-white font-semibold hover:bg-red-700"
					>
						Log Out
					</button>
				</div>
			</header>

			{/* Hero Section */}
			<section className="mb-auto relative flex flex-col items-center justify-center text-center px-6 py-20 z-10">
				<h1 className="text-4xl md:text-5xl font-bold mb-6">
					Welcome, {session?.user?.name}!
				</h1>
				{isConnected == 2 ? (
					<p>Error checking Notion status</p>
				) : (
					<p></p>
				)}
				{isConnected == 1 ? (
					<div>
						<div className="inline-flex items-center gap-2  px-4 py-2 rounded-full mb-4">
							<CheckCircle className="h-5 w-5 text-[#1db954]" />
							<span className="text-lg">
								Notion is connected!
							</span>
						</div>
						<p className="font-bold pb-4">
							Most recently edited page: &quot;
							{recentlyEditedName}&quot; at {recentlyEditedDate}
						</p>
						<div>
							<div className="bg-[#0c0c3d]/30 p-6 rounded-xl border border-indigo-900/30 max-w-2xl mx-auto">
								<h3 className="text-xl font-semibold mb-4">
									What now?
								</h3>
								<p className="text-gray-300 mb-4">
									To get started, start writing a diary of
									your feelings on Notion. Make sure you
									include EchoMind in the title to ensure it
									gets detected. The app will automatically
									pull the most recently edited page.{" "}
									<br></br> If the page does not show, make
									sure to go to Settings &gt; Connections
									(under Account) &gt; EchoMind and click the
									3 dots and Access Selected Pages
								</p>
								<div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
									<button
										onClick={() =>
											playlistGenerateFromText()
										}
										className="flex flex-row items-center bg-[#f5b400] hover:bg-[#f5c730] text-black font-semibold px-6 py-2 rounded-full"
									>
										<Music className="mr-2 h-5 w-5" />
										Generate a playlist!
									</button>
									<button
										className=" flex flex-row items-center border-[#f5b400] text-[#f5b400] hover:bg-[#f5b400]/10 font-semibold px-6 py-2 rounded-full"
										onClick={() =>
											playlistGenerateFromText_IFSPOTIFYBUGGED()
										}
									>
										<RefreshCw className="mr-2 h-5 w-5" />
										Playlist Not Showing Up?
									</button>
								</div>
							</div>
						</div>
						<div className="p-4 text-xl">
							{addedTracks == 5 ? (
								<p className="">Generating...</p>
							) : addedTracks == 1 ? (
								<p className="text-green-500">
									Added Tracks successfully!
								</p>
							) : addedTracks == 2 && !rateLimitMsg ? (
								<p className="text-red-500">
									Error adding tracks. Try logging out and in.
								</p>
							) : addedTracks == 2 && rateLimitMsg ? (
								<p className="text-red-500">
									Slow down! Wait 5 minutes between requests.
								</p>
							) : (
								<p></p>
							)}
              {emotionData && Object.keys(emotionData).length > 0 && (
                <div className="mt-6 p-6 bg-[#0c0c3d]/30 rounded-xl border border-indigo-900/30">
                  <h3 className="text-xl font-semibold mb-4">Emotion Analysis</h3>
                  <table className="min-w-full table-auto text-left">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Emotion</th>
                        <th className="px-4 py-2">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(emotionData).map(([emotion, score]) => (
                        <tr key={emotion}>
                          <td className="px-4 py-2">{emotion}</td>
                          <td className="px-4 py-2">{score as ReactNode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
							{playlistId != "" ? (
								<div className="justify-between flex flex-col items-center pt-4 ">
									<SpotifyEmbed key={embedKeyValue}
										className="sm:w-[500] md:w-[600] h-[500]"
										src={`https://open.spotify.com/playlist/${playlistId}`}
									/>
								</div>
							) : (
								<div></div>
							)}
						</div>
					</div>
				) : (
					<div className="items-center justify-between flex flex-col">
						<button
							onClick={() => checkAndCallConnect()}
							className="flex flex-row items-center bg-white hover:bg-gray-200 text-black font-semibold px-6 py-2 rounded-full"
						>
							Connect Notion
						</button>
						<p className="p-4">
							Notion will prompt you to select which pages to
							link. Make sure to select the right ones.
						</p>
					</div>
				)}
			</section>
			<footer className="text-white/50 items-center text-center bottom-0 p-8 font-light ">
				Amin Karic - Copyright 2025 <br></br>aminkaric@tamu.edu
			</footer>
		</div>
	);
}
