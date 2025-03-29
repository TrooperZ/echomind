"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Home() {
	const { data: session } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (session) {
			router.push("/dashboard"); // Redirect to dashboard if logged in
		}
	}, [session, router]);

	return (
		<div className="relative flex flex-col min-h-screen bg-[#0D0D2B] text-white overflow-hidden">
			{/* Background Circles */}
			<div className="absolute top-[-50px] left-[-100px] w-[300px] h-[300px] bg-blue-500 opacity-30 rounded-full blur-3xl"></div>
			<div className="absolute bottom-[-100px] right-[-50px] w-[250px] h-[250px] bg-purple-500 opacity-30 rounded-full blur-3xl"></div>
			<div className="absolute top-[30%] left-[50%] w-[200px] h-[200px] bg-indigo-500 opacity-20 rounded-full blur-2xl"></div>

			{/* Navbar */}
			<nav className="flex justify-between items-center w-full px-10 py-6 bg-[#0A0A23] relative z-10">
				<div className="flex items-center gap-2">
					<Image
						src="/EchoMind_Logo.png"
						className="rounded-lg"
						alt="Logo"
						width={40}
						height={40}
					/>
					<span className="text-2xl pl-2 font-bold">EchoMind</span>
				</div>
				<div className="hidden md:flex gap-6 text-gray-300">
					<a href="#" className="hover:text-white">
						Home
					</a>
					<a href="#" className="hover:text-white">
						About
					</a>
					<a href="#" className="hover:text-white">
						Features
					</a>
					<a href="#" className="hover:text-white">
						Contact
					</a>
				</div>
				<div className="flex gap-4">
					<button
						onClick={() => signIn("spotify")}
						className="bg-[#1db954] hover:bg-[#1ed760] text-white font-semibold px-6 py-2 rounded-full"
					>
						Log in with Spotify
					</button>
					{/* <button
						onClick={() => signIn("google")}
						className="bg-blue-600 px-6 py-3 rounded-lg shadow-md text-white font-semibold hover:bg-blue-700 transition"
					>
						Log in with Google
					</button>  */}
				</div>
			</nav>

			{/* Hero Section */}
			<section className="mb-auto relative flex flex-col items-center justify-center text-center px-6 py-20 z-10">
				<div className="max-w-3xl mx-auto text-center space-y-8">
					<div className="space-y-4">
						<motion.h2
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8 }}
							className="text-5xl md:text-7xl font-bold tracking-tight"
						>
							Turn your thoughts into{" "}
							<span className="text-[#1db954]">music</span>
						</motion.h2>
						<motion.p
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.3 }}
							className="text-xl md:text-2xl text-gray-300 leading-relaxed"
						>
							Music can change or reinforce moods. Let us help
							with yours.
						</motion.p>
					</div>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.6 }}
						className="bg-[#0c0c3d]/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-indigo-900/50"
					>
						<p className="text-lg md:text-xl leading-relaxed mb-6">
							EchoMind helps you transform your Notion diary into
							personalized Spotify playlists. Connect, analyze,
							and enjoy music that matches your emotions.
						</p>
						<button
							onClick={() => signIn("spotify")}
							className="bg-[#1db954] hover:bg-[#1ed760] text-white font-semibold px-8 py-4 rounded-full text-lg"
						>
							Get Started
						</button>
					</motion.div>
				</div>
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.9 }}
					className="grid md:grid-cols-3 gap-6 mt-12"
				>
					<div className="bg-[#0c0c3d]/30 p-6 rounded-xl border border-indigo-900/30">
						<div className="w-12 h-12 bg-[#1db954]/20 rounded-full flex items-center justify-center">
							<span className="text-2xl">1</span>
						</div>
						<h3 className="text-xl font-semibold mb-2">Connect</h3>
						<p className="text-gray-300">
							Link your Spotify and Notion accounts securely
						</p>
					</div>
					<div className="bg-[#0c0c3d]/30 p-6 rounded-xl border border-indigo-900/30">
						<div className="w-12 h-12 bg-[#1db954]/20 rounded-full flex items-center justify-center ">
							<span className="text-2xl">2</span>
						</div>
						<h3 className="text-xl font-semibold mb-2">Write</h3>
						<p className="text-gray-300">
							Express your thoughts and feelings in your Notion
							diary
						</p>
					</div>
					<div className="bg-[#0c0c3d]/30 p-6 rounded-xl border border-indigo-900/30">
						<div className="w-12 h-12 bg-[#1db954]/20 rounded-full flex items-center justify-center ">
							<span className="text-2xl">3</span>
						</div>
						<h3 className="text-xl font-semibold mb-2">Listen</h3>
						<p className="text-gray-300">
							Enjoy personalized playlists that match your mood using our custom language analyzer, no GPT wrapper!
						</p>
					</div>
				</motion.div>
				<div className="pt-4">
					<p>We ensure privacy of your data and thoughts. No text entries are stored on our servers. </p>
				</div>
			</section>
			<footer className="text-white/50 items-center text-center bottom-0 p-8 font-light">Amin Karic - Copyright 2025 <br></br>aminkaric@tamu.edu</footer>
		</div>
	);
}
