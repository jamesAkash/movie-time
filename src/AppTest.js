import { useEffect, useRef, useState } from "react";
// import { tempMovieData, tempWatchedData } from "./data";
import StarRating from "./StarRating";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = "7bc7249b";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  // const [watched, setWatched] = useState([]);
  const [watched, setWatched] = useState(() => {
    const storedValue = localStorage.getItem("watched")
      ? JSON.parse(localStorage.getItem("watched"))
      : [];
    return storedValue;
  });

  function handleSelectMovie(id) {
    setSelectedId((selectedId) => (id === selectedId ? null : id));
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleDeleteWatched(id) {
    const newList = watched.filter((movie) => movie.imdbID !== id);
    setWatched(newList);
    //TESTING
    localStorage.setItem("watched", JSON.stringify(newList));
  }

  useEffect(() => {
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
    handleCloseMovie();
    fetchData();

    return () => {
      controller.abort();
    };
  }, [query]);

  //LOCAL STORAGE
  useEffect(() => {
    localStorage.setItem("watched", JSON.stringify(watched));
  }, [watched]);

  return (
    <>
      <Navbar>
        <Search query={query} setQuery={setQuery} />
        <NumResults num={movies?.length || "0"} />
      </Navbar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!query && <SearchWelcome />}
          {!isLoading && !error && (
            <MovieList movies={movies} onSelectMovie={handleSelectMovie} />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          <>
            {selectedId ? (
              <MovieDetails
                selectedId={selectedId}
                onCloseMovie={handleCloseMovie}
                onAddWatched={handleAddWatched}
                watched={watched}
              />
            ) : (
              <>
                <WatchedSummary watched={watched} />
                <WatchedMoviesList
                  watched={watched}
                  onDeleteWatched={handleDeleteWatched}
                />
              </>
            )}
          </>
        </Box>
      </Main>
    </>
  );
}

const SearchWelcome = () => {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1>Start Searching👀</h1>
      <h1>...</h1>
    </div>
  );
};

const Search = ({ query, setQuery }) => {
  const inputEl = useRef(null);
  useEffect(() => {
    const callBack = (e) => {
      if (document.activeElement === inputEl.current) return;

      if (e.code === "Enter") {
        inputEl.current.focus();
        setQuery("");
      }
    };
    document.addEventListener("keydown", callBack);
    return () => document.addEventListener("keydown", callBack);
  }, [setQuery]);
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
};

const ErrorMessage = ({ message }) => {
  return (
    <p className="error">
      <span>💀</span> {message}
    </p>
  );
};

const Loader = () => {
  return <p className="loader">Loading...</p>;
};

const Box = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
};

const MovieList = ({ movies, onSelectMovie }) => {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie onSelectMovie={onSelectMovie} key={movie.imdbID} movie={movie} />
      ))}
    </ul>
  );
};

const Movie = ({ movie, onSelectMovie }) => {
  return (
    <li onClick={() => onSelectMovie(movie.imdbID)} key={movie.imdbID}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
};

const MovieDetails = ({ selectedId, onCloseMovie, onAddWatched, watched }) => {
  const [movie, setMovie] = useState({});
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState("");

  const countRef = useRef(0);
  useEffect(() => {
    if (userRating) countRef.current = countRef.current + 1;
  }, [userRating]);

  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId);
  const watchedUserRating = watched.find(
    (movie) => movie.imdbID === selectedId
  )?.userRating;

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      countRatingDecisions: countRef.current,
    };
    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  useEffect(() => {
    const getMovieDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
        );
        const data = await res.json();
        setMovie(data);
        setLoading(false);
        // console.log(data);
      } catch (err) {
        console.error(err.message);
        setLoading(false);
      }
    };
    getMovieDetails();
  }, [selectedId]);

  useEffect(() => {
    if (!title) return;
    document.title = `Movie | ${title}`;

    return () => {
      document.title = `movieWorld`;
    };
  }, [title]);

  useEffect(() => {
    const callBack = (e) => {
      if (e.code === "Escape") {
        onCloseMovie();
        // console.log("closing movie");
      }
    };
    document.addEventListener("keydown", callBack);
    return () => {
      document.removeEventListener("keydown", callBack);
    };
  }, [onCloseMovie]);

  return (
    <div className="details">
      {!loading ? (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${title}`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span>
                {imdbRating} IMDB Rating
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <h1>Give Your Rating</h1>
                  <StarRating
                    maxRating={10}
                    size={26}
                    onSetRating={setUserRating}
                  />
                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleAdd}>
                      + Add to List
                    </button>
                  )}
                </>
              ) : (
                <p>
                  You previously rated this movie {watchedUserRating}{" "}
                  <span>⭐</span>
                </p>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      ) : (
        <Loader />
      )}
    </div>
  );
};

const WatchedSummary = ({ watched }) => {
  const avgImdbRating = average(
    watched.map((movie) => movie.imdbRating)
  ).toFixed(1);
  const avgUserRating = average(
    watched.map((movie) => movie.userRating)
  ).toFixed(1);
  const avgRuntime = average(watched.map((movie) => movie.runtime)).toFixed(1);
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
};

const WatchedMoviesList = ({ watched, onDeleteWatched }) => {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteWatched={onDeleteWatched}
        />
      ))}
    </ul>
  );
};

const WatchedMovie = ({ movie, onDeleteWatched }) => {
  return (
    <li key={movie.imdbID}>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={() => onDeleteWatched(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
};

/////
const Navbar = ({ children }) => {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
};

const Logo = () => {
  return (
    <div className="logo">
      <span role="img">👀</span>
      <h1>Movie</h1>
    </div>
  );
};

const NumResults = ({ num }) => {
  return (
    <p className="num-results">
      <strong>{num}</strong> results
    </p>
  );
};

const Main = ({ children }) => {
  return <main className="main">{children}</main>;
};
