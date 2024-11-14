const apiKey = '014cb373e0c739a99ae64ce63cf87447';


function showToast(message, type = 'default') {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    
    toast.className = "toast";
    
    if (type === "success") {
        toast.classList.add("toast-success", "show");
    } else if (type === "error") {
        toast.classList.add("toast-error", "show");
    } else {
        toast.className = "toast show";
    }

    setTimeout(() => { toast.classList.remove("show"); }, 3000);
}


function renderWatchlist() {
    const moviesGrid = document.querySelector('#movies-grid');
    const watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
    moviesGrid.innerHTML = ""; 

    if (watchlist.length === 0) {
        moviesGrid.innerHTML = "<p>No movies in your Watchlist</p>";
    } else {
        watchlist.forEach(movie => {
            console.log(movie);
            const movieCard = document.createElement("div");
            movieCard.classList.add("movie-card");

            movieCard.innerHTML = `
                <img src="${movie.image} || 'default-image.jpg'}" alt="${movie.title}">
                <h3>${movie.title}</h3>
                <p>Release Date: ${movie.releaseDate}</p>
                <button class="watchlist-button" onclick="removeFromWatchlist(${movie.id}, event)">
                   Remove from Watchlist
                </button>
            `;

            movieCard.addEventListener("click", async () => {
                const movieData = await getMovieDetails(movie.id);
                if (movieData) openModal(movieData.id);
            });

            moviesGrid.appendChild(movieCard);
        });
    }
}

async function removeFromWatchlist(movieId, event) {
    event.stopPropagation();
    
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    watchlist = watchlist.filter(m => m.id !== movieId);    
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    showToast("Movie removed from Watchlist", "success");
    renderWatchlist();
}

async function getMovieDetails(id) {
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const movieData = await response.json();
        return movieData;
    } catch (error) {
        console.error("Error fetching movie details:", error);
        return null;
    }
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
            removeFromWatchlist(movieDetails.id, event);
            document.getElementById("movie-modal").style.display = "none";
        };

    } catch (error) {
        console.error("Error fetching movie data:", error);
        showToast("Error loading movie details");
    }
}

const closeButton = document.querySelector(".close");
if (closeButton) {
    closeButton.onclick = function () {
        document.getElementById("movie-modal").style.display = "none";
    };
}

window.addEventListener("storage", (event) => {
    if (event.key === "watchlist") {
        renderWatchlist();
    }
});


renderWatchlist();
