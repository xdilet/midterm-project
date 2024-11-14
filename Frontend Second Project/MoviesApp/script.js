const apiKey = '014cb373e0c739a99ae64ce63cf87447';

const inputElement = document.querySelector('#search-input');
let moviesArray = [];
const suggestionList = document.querySelector('#suggestions-list');


function showToast(message, type = 'default') {
    const toast = document.querySelector('#toast');
    toast.textContent = message;
    toast.className = "toast";
    if (type === "success") {
        toast.classList.add("toast-success", "show");
    }else if(type == 'error'){
        toast.classList.add("toast-error", "show");
    }else {
        toast.className = "toast show";
    }
    setTimeout(() => { toast.className = "toast"; }, 3000);
}

async function fetchMovieSuggestions(query) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`);
        const data = await response.json();
        return data.results.slice(0, 5);
    } catch (error) {
        console.error("Error fetching info", error);
        return [];
    }
}

async function showSuggestions(suggestions) {
    suggestionList.innerHTML = ''; 

    if (!suggestions || suggestions.length === 0) {
        const noResultsMessage = document.createElement('li');
        noResultsMessage.textContent = 'No results found.';
        suggestionList.appendChild(noResultsMessage);
    } else {
        suggestions.forEach(suggestion => {
            if (!suggestion || !suggestion.poster_path || !suggestion.title) return;

            const listItem = document.createElement('li');
            listItem.classList.add('suggestion-item');

            const image = document.createElement('img');
            image.src = `https://image.tmdb.org/t/p/w92${suggestion.poster_path}`; 
            image.alt = suggestion.title;
            image.classList.add('suggestion-image');

            const text = document.createElement('span');
            text.textContent = suggestion.title;

            listItem.appendChild(image);
            listItem.appendChild(text);

            listItem.addEventListener('click', () => {
                inputElement.value = suggestion.title;
                suggestionList.innerHTML = ''; 
                searchMovie(suggestion.id);
            });

            suggestionList.appendChild(listItem);
        });
        suggestionList.style.display = 'block';
    }
}

async function searchMovie(id) {
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        displayMovie(data);
    } catch (error) {
        console.error("Error searching movie", error);
        return null;
    }
}

async function displayMovie(movie) {
    const movieGrid = document.getElementById("movies-grid");
    movieGrid.innerHTML = ""; 
    const movieCard = document.createElement("div");
    movieCard.classList.add("movie-card");

    let shortDescription = movie.overview;

    movieCard.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
        <h3>${movie.title}</h3>
        <p>${shortDescription || "No description available"}</p>
        <p>Release date: ${movie.release_date}</p>
    `;

    const watchlistButton = document.createElement("button");
    watchlistButton.classList.add("watchlist-button");
    watchlistButton.innerText = "☆ Add to Watchlist";
    watchlistButton.addEventListener("click", (event) => addToWatchlist(movie, event));
    movieCard.appendChild(watchlistButton);
    
    movieCard.addEventListener("click", (event) => {
        if (!event.target.classList.contains("watchlist-button")) {
            openModal(movie.id);
        }
    });
    movieGrid.appendChild(movieCard);
}



function clearAutocompleteResults() {
    suggestionList.innerHTML = ''; 
}

let debounceTimeout;
inputElement.addEventListener('input', async () => {
    const query = inputElement.value.trim();

    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(async () => {
        if (query.length > 1) {
            const suggestions = await fetchMovieSuggestions(query);
            showSuggestions(suggestions);
        } else {
            clearAutocompleteResults();
        }
    }, 500);
});

inputElement.addEventListener('focus', async () => {
    const query = inputElement.value.trim();

    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(async () => {
        if (query.length > 1) {
            const suggestions = await fetchMovieSuggestions(query);
            showSuggestions(suggestions);
        } else {
            clearAutocompleteResults();
        }
    }, 500);
});

inputElement.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        clearAutocompleteResults();
        searchMovies(inputElement.value);
    }
});

document.addEventListener('click', function(event) {
    if (!inputElement.contains(event.target) && !suggestionList.contains(event.target)) {
        clearAutocompleteResults(); 
    }
});


async function searchMovies() {
    const query = inputElement.value.trim(); 

    if (query.length > 0) {
        const apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`;
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            moviesArray = data.results;
            console.log(moviesArray);
            displayMovies(data.results || []); 
            if ((data.results || []).length === 0) {
                showToast("No movies found. Try a different search.");
            }
        } catch (error) {
            console.error("Error fetching movies:", error);
        }
    } else {

        showToast("Please enter a search term.");
    }
}

document.querySelector("#sort-select").addEventListener("change", (event) => {
   if(moviesArray.length > 1 ) {
    const criterion = event.target.value; 
    const sortedMovies = sortMovies([...moviesArray], criterion);  
    displayMovies(sortedMovies);  
   }
});


function sortMovies(movies, criterion) {
    switch (criterion) {
        case 'popularity':
            return movies.sort((a, b) => b.popularity - a.popularity); 
        case 'release_date':
            return movies.sort((a, b) => new Date(b.release_date) - new Date(a.release_date)); 
        case 'rating':
            return movies.sort((a, b) => b.vote_average - a.vote_average); 
        default:
            return movies; 
    }
}

async function displayMovies(movies) {
    const movieGrid = document.getElementById("movies-grid");
    movieGrid.innerHTML = ""; 

    for (const movie of movies) {
        const movieCard = document.createElement("div");
        movieCard.classList.add("movie-card");

        try {
            movieCard.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
                <h3>${movie.title}</h3>
                <p>${movie.overview || "No description available"}</p>
                <p>Release date: ${movie.release_date}</p>
            `;

            const watchlistButton = document.createElement("button");
            watchlistButton.classList.add("watchlist-button");
            watchlistButton.innerText = "☆ Add to Watchlist";

            watchlistButton.addEventListener("click", (event) => addToWatchlist(movie, event));
            movieCard.appendChild(watchlistButton);

            movieCard.addEventListener("click", (event) => {
                if (!event.target.classList.contains("watchlist-button")) {
                    openModal(movie.id); 
                }
            });

            movieGrid.appendChild(movieCard);
        } catch (error) {
            console.error("Error displaying movie card:", error);
        }
    }
}

async function addToWatchlist(movieData, event) {
    event.stopPropagation();
    let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

    if (watchlist.some(fav => fav.id === movieData.id)) {
        showToast("This movie is already on your list.");
        return;
    }

    const firstSentence = movieData.overview?.split('.')[0] + "." || "Нет описания.";

    watchlist.push({
        id: movieData.id,
        description: firstSentence,
        title: movieData.title,
        image: `https://image.tmdb.org/t/p/w500${movieData.poster_path}`,
        releaseDate: movieData.release_date,
    });

    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    showToast("The movie has been added to the waiting list!", "success");
}



async function openModal(movieId) {
    const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`;
    const creditsUrl = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apiKey}`;

    try {
        const movieDetailsResponse = await fetch(movieDetailsUrl);
        const movieDetails = await movieDetailsResponse.json();

        const creditsResponse = await fetch(creditsUrl);
        const credits = await creditsResponse.json();

        document.getElementById("movie-details").innerHTML = `
            <h2 id="modalTitle">${movieDetails.title}</h2>
            <p id="modalOverview">${movieDetails.overview || "No overview available"}</p>
            <p id="modalRating">Rating: ${movieDetails.vote_average || "N/A"} / 10</p>
            <p id="modalRuntime">Runtime: ${movieDetails.runtime ? `${movieDetails.runtime} minutes` : "N/A"}</p>
            
            <h3>Cast</h3>
            <ul id="modalCast">
                ${credits.cast.map(member => `<li>${member.name} as ${member.character}</li>`).join('')}
            </ul>
            
            <h3>Crew</h3>
            <ul id="modalCrew">
                ${credits.crew.map(member => `<li>${member.name} - ${member.job}</li>`).join('')}
            </ul>
        `;

        document.getElementById("movie-modal").style.display = "block";

        document.querySelector('#modalWatchlistButton').onclick = (event) => {
            addToWatchlist(movieDetails, event);
        };

    } catch (error) {
        console.error("Error fetching movie data:", error);
        showToast("Error loading movie details");
    }
}

document.querySelector(".close").onclick = function() {
    document.getElementById("movie-modal").style.display = "none";
};

