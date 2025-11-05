import { useEffect, useState } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import { getTrendingMovies, updateSearchCount } from "./appwrite";

const API_BASE_URL = "/api/movies"; // Your proxy endpoint

// SSR-safe debounce hook
function useDebounceSSR(callback, delay, deps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true); // Only run on client
  }, []);

  useEffect(() => {
    if (!ready) return; // Skip on SSR

    const handler = setTimeout(() => {
      callback();
    }, delay);

    return () => clearTimeout(handler);
  }, [...(deps || []), ready]);
}

const App = () => {
  const [debounceSearchTerm, setDebounceSearchTerm] = useState(""); // Debounced search term
  const [searchTerm, setSearchTerm] = useState(""); // Search bar state

  const [movieList, setMovieList] = useState([]); // Movies fetched from TMDB's API
  const [errorMessage, setErrorMessage] = useState(""); // Error handling
  const [isLoading, setIsLoading] = useState(false); // Fetch loading state

  const [trendingMovies, setTrendingMovies] = useState([]); // Trending movies from Appwrite

  // Debounce the search term to prevent too many API requests (wait 500ms after typing stops)
  useDebounceSSR(() => setDebounceSearchTerm(searchTerm), 800, [searchTerm]);

  // Fetch movies data from TMDB via the server proxy
  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query
        ? `${API_BASE_URL}?query=${encodeURIComponent(query)}`
        : API_BASE_URL;

      // Fetching data from the Endpoint proxy.
      const response = await fetch(endpoint);

      if (!response.ok) throw new Error("Failed to fetch movies - Client");

      const data = await response.json();

      if (data.Response === "False") {
        setErrorMessage(data.Error || "Failed to fetch movies");

        setMovieList([]);

        return; // Exit out of the function.
      }

      setMovieList(data || []); // Populating with movies upon successful fetch.

      if (query && data.length > 0) {
        await updateSearchCount(query, data[0]); // Update search count in Appwrite.
      }
    } catch (e) {
      console.error(`Error fetching movies: ${e}`);
      setErrorMessage("Error fetching movies. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  };

  // Fetch movies when debounced search term changes
  useEffect(() => {
    fetchMovies(debounceSearchTerm);
  }, [debounceSearchTerm]);

  // Load trending movies on mount
  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without the Hassle
          </h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>All Movies</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
