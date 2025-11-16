import type { Metadata } from "next";
import {
  fetchHeroProjects,
  fetchTrendingProjects,
  fetchPopularProjects,
  fetchLatestProjects,
  fetchTrendingUsers,
  fetchPopularUsers,
} from "@/lib/api";
import { HomeScreen } from "@/modules/home/screens/HomeScreen";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Home - Discover Blockchain Games",
  description: "Explore trending and popular blockchain games. Play to earn real rewards, create your own games, and join the web3 gaming revolution.",
  openGraph: {
    title: "Degu.Games - Discover Blockchain Games",
    description: "Explore trending and popular blockchain games. Play to earn real rewards.",
  },
};

export default async function Home() {
  // Fetch all data in parallel - each section gets distinct data
  const [
    heroProjects,          // Hero slider: hardcoded featured games (4 games)
    whatWerePlayingProjects, // "What We're Playing": trending games (12 games)
    mustPlayProjects,      // "Must-Play Games": popular all-time games (12 games)
    trendingGamesRanking,  // "Trending Games" ranking cards: trending with limit 10
    latestProjects,        // Latest projects (not currently used but available)
    trendingUsers,         // Trending users
    popularUsers,          // Popular users
  ] = await Promise.all([
    fetchHeroProjects(),                 // Hardcoded 4 featured games
    fetchTrendingProjects("7d", 12),    // Trending for "What We're Playing"
    fetchPopularProjects(12),           // Popular for "Must-Play Games"
    fetchTrendingProjects("7d", 10),    // Trending for ranking section
    fetchLatestProjects(12),            // Latest projects
    fetchTrendingUsers("7d", 8),        // Trending users
    fetchPopularUsers(8),               // Popular users
  ]);

  return (
    <HomeScreen
      featuredProjects={heroProjects}
      trendingProjects={whatWerePlayingProjects}
      popularProjects={mustPlayProjects}
      trendingGamesRanking={trendingGamesRanking}
      latestProjects={latestProjects}
      trendingUsers={trendingUsers}
      popularUsers={popularUsers}
    />
  );
}
