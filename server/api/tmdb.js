/* global console */
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_BASE_URL = "https://api.themoviedb.org/3";

export async function fetchMovies(query = "") {
  const API_KEY = process.env.TMDB_API_KEY;

  const endpoint = query
    ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
        query
      )}&include_adult=false`
    : `${API_BASE_URL}/discover/movie?include_adult=false&sort_by=popularity.desc`;

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  };

  const response = await fetch(endpoint, options);

  if (!response.ok) throw new Error("Failed to fetch movies");

  const data = await response.json();

  if (!data || typeof data !== "object" || !("results" in data)) {
    console.warn("Unexpected TMDB response:", data);
    return [];
  }

  return data.results || [];
}
