import { useEffect, useState } from "react";
const KEY = "7bc7249b";

const useMovies = (query) => {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    // callBack?.();
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
          {
            signal: controller.signal,
          }
        );
        if (!res.ok) throw new Error("Something went wrong!!");
        const data = await res.json();
        setMovies(data.Search);

        if (data.Response === "False") throw new Error("Movie Not Found");
        setError("");
        // setIsLoading(false);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          console.error(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };
    if (query.length < 2) {
      setMovies([]);
      setError("");
      return;
    }
    // handleCloseMovie();
    fetchData();

    return () => {
      controller.abort();
    };
  }, [query]);

  return { movies, isLoading, error };
};

export { useMovies };
