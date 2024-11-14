// apiKey
const apiKey = 'f1965a9453bb438cb684eb05f0477f08'; 

const recipeInput = document.getElementById('recipeInput');
const autocompleteResults = document.getElementById('autocomplete-results');

// Displays a toast notification with a message and style based on the specified type ('success', 'error', or 'default')
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

// Switching the search mode
document.querySelector("#searchByName").addEventListener("click", () => {
    toggleSearchMode("name");
});
document.querySelector("#searchByIngredient").addEventListener("click", () => {
    toggleSearchMode("ingredient");
    showToast("Input type must be: apples, flour, sugar");
});

// Toggle search mode between name and ingredient
function toggleSearchMode(mode) {
    const nameButton = document.querySelector("#searchByName");
    const ingredientButton = document.querySelector("#searchByIngredient");

    if (mode === "name") {
        nameButton.classList.add("active");
        ingredientButton.classList.remove("active");
        recipeInput.setAttribute('data-search-mode', 'name');
        document.querySelector("#recipeInput").placeholder = "Search by recipe name...";
    } else {
        ingredientButton.classList.add("active");
        nameButton.classList.remove("active");
        recipeInput.setAttribute('data-search-mode', 'ingredient');
        document.querySelector("#recipeInput").placeholder = "Search by ingredients...";
    }
}

    //fetch info based on name or ingredients
async function fetchRecipeSuggestions(query, isNameSearch = true) {
    let url;
    if (isNameSearch) {
        url = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=20&apiKey=${apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }

            const data = await response.json();
            const filteredSuggestions = data.results
                .filter(recipe => recipe.title.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 5); 
            return filteredSuggestions;
        } catch (error) {
            console.error('Failed to fetch recipe suggestions:', error);
            return []; 
        }
    } else {
        const ingredientList = query.split(',').map(ingredient => ingredient.trim()).join(',');
        url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientList}&number=5&apiKey=${apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }

            const suggestions = await response.json();
            return suggestions;
        } catch (error) {
            console.error('Failed to fetch recipe suggestions:', error);
            return []; 
        }
    }
}

//show that info's
async function showSuggestions(suggestions) {
    autocompleteResults.innerHTML = ''; 

    if (!suggestions || suggestions.length === 0) {
        const noResultsMessage = document.createElement('li');
        noResultsMessage.textContent = 'No results found.';
        autocompleteResults.appendChild(noResultsMessage);
    } else {
        suggestions.forEach(suggestion => {
            if (!suggestion || !suggestion.image || !suggestion.title) {
                return; 
            }

            const listItem = document.createElement('li');
            listItem.classList.add('autocomplete-item');

            const image = document.createElement('img');
            image.src = suggestion.image;
            image.alt = suggestion.title;
            image.classList.add('autocomplete-image');

            const text = document.createElement('span');
            text.textContent = suggestion.title;

            listItem.appendChild(image);
            listItem.appendChild(text);

            listItem.addEventListener('click', () => {
                recipeInput.value = suggestion.title;
                autocompleteResults.innerHTML = '';
                searchRecipe(suggestion.id);
            });
            
            autocompleteResults.appendChild(listItem);
        });
    }
}

//search for a recipe by its id
async function searchRecipe(id) {
    const url = `https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`

    try {
        const response = await fetch(url);
        const data = await response.json();
        displayRecipe(data);
    } catch (error) {
        console.error("Error searching recipe", error);
        showToast("Error searching recipe", "error");
        return null;
    }
}
//display recipe from searchRecipe
async function displayRecipe(recipe) {
    const recipeGrid = document.getElementById("recipeGrid");
    recipeGrid.innerHTML = ""; 
    const recipeCard = document.createElement("div");
    recipeCard.classList.add("recipe-card");
    let shortDescription = recipe.summary.split('.')[0] + ".";

    recipeCard.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.title}">
                <h3>${recipe.title}</h3>
                <p>${shortDescription || "No description available"}</p>
                <p>Ready in ${recipe.readyInMinutes} mins</p>
            `;

            const favoriteButton = document.createElement("button");
            favoriteButton.classList.add("favorite-button");
            favoriteButton.innerText = "☆ Add to favorite";
            favoriteButton.addEventListener("click", (event) => addToFavorites(recipe, event));
            recipeCard.appendChild(favoriteButton);
            
            recipeCard.addEventListener("click", (event) => {
                if (!event.target.classList.contains("favorite-button")) {
                    openModal(recipe);
                }
            });
            recipeGrid.appendChild(recipeCard);
}
//clear
function clearAutocompleteResults() {
    autocompleteResults.innerHTML = ''; 
}
//when typing we get suggestions and also when we return to typing also get suggestions
let debounceTimeout;
recipeInput.addEventListener('input', async () => {
    const query = recipeInput.value.trim();
    const isNameSearch = recipeInput.getAttribute('data-search-mode') === 'name';

    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(async () => {
        if (query.length > 1) {
            const suggestions = await fetchRecipeSuggestions(query, isNameSearch);
            showSuggestions(suggestions);
        } else {
            clearAutocompleteResults();
        }
    }, 500); 
});

recipeInput.addEventListener('focus', async () => {
    const query = recipeInput.value.trim();
    const isNameSearch = recipeInput.getAttribute('data-search-mode') === 'name';

    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(async () => {
        if (query.length > 1) {
            const suggestions = await fetchRecipeSuggestions(query, isNameSearch);
            showSuggestions(suggestions);
        } else {
            clearAutocompleteResults();
        }
    }, 500); 
});

// Launch the search function if the Enter key is pressed
recipeInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        clearAutocompleteResults();
        searchRecipes(); 
    }
});
// click outside the suggestions 
document.addEventListener('click', function(event) {
    if (!recipeInput.contains(event.target) && !autocompleteResults.contains(event.target)) {
        clearAutocompleteResults(); 
    }
});

//A function for performing a search recipeS
async function searchRecipes() {
    if(recipeInput.getAttribute('data-search-mode') == 'name') {
        const query = recipeInput.value.trim();
        const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&apiKey=${apiKey}&number=100`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            displayRecipes(data.results || []);
            if ((data.results || []).length === 0) {
                showToast("No recipes found. Try a different search.");
            }
        } catch (error) {
            console.error("Error fetching recipes:", error);
        }
    }else {
        const ingredients = recipeInput.value;
        const ingredientList = ingredients.split(', ').map(ingredient => '+' + ingredient).join(',');
        const apiUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientList}&number=100&apiKey=${apiKey}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            displayRecipes(data || []);
            if ((data || []).length === 0) {
                showToast("No recipes found for these ingredients.");
            }
        }catch (error) {
            console.error("Error fetching recipes:", error);
        }
    }
}

// Function for displaying recipeS
async function displayRecipes(recipes) {
    const recipeGrid = document.getElementById("recipeGrid");
    recipeGrid.innerHTML = ""; 

    for (const recipe of recipes) {
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("recipe-card");

        try {
            const recipeData = await getRecipeDetails(recipe.id);
            if (!recipeData) continue;

            recipeCard.innerHTML = `
                <img src="${recipeData.image}" alt="${recipeData.title}">
                <h3>${recipeData.title}</h3>
                <p>${recipeData.shortDescription || "No description available"}</p>
                <p>Ready in ${recipeData.readyInMinutes} mins</p>
            `;

            const favoriteButton = document.createElement("button");
            favoriteButton.classList.add("favorite-button");
            favoriteButton.innerText = "☆ Add to favorite";
            favoriteButton.addEventListener("click", (event) => addToFavorites(recipeData, event));
            recipeCard.appendChild(favoriteButton);

            recipeCard.addEventListener("click", (event) => {
                if (!event.target.classList.contains("favorite-button")) {
                    openModal(recipeData);
                }
            });

            recipeGrid.appendChild(recipeCard);
        } catch (error) {
            console.error("Error displaying recipe card:", error);
        }
    }
}
//add to fav
async function addToFavorites(recipeData, event) {
    event.stopPropagation();
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    if (favorites.some(fav => fav.id === recipeData.id)) {
        showToast("This recipe is already in your favorites.");
        return;
    }

    const firstSentence = recipeData.summary?.split('.')[0] + "." || "No summary available.";

    favorites.push({
        id: recipeData.id,
        description: firstSentence,
        title: recipeData.title,
        image: recipeData.image,
        time: recipeData.readyInMinutes,
    });

    localStorage.setItem("favorites", JSON.stringify(favorites));
    showToast("Recipe added to favorites!", "success");
}
  
//get details by ID
async function getRecipeDetails(id) {
    const url = `https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`;
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error fetching recipe details: ${response.statusText}`);
        }

        const recipeData = await response.json();
        
        const readyInMinutes = recipeData.readyInMinutes || "N/A";
        const summary = recipeData.summary || "";
        const firstSentence = summary ? summary.split('.')[0] + "." : "No description available.";

        return {
            ...recipeData,
            readyInMinutes,
            shortDescription: firstSentence,
        };
    } catch (error) {
        console.error("Error fetching recipe:", error);
        return null;
    }
}

//model 
async function openModal(recipeData) {
    document.getElementById("modalTitle").innerHTML = recipeData.title;
    document.getElementById("modalDescription").innerHTML = recipeData.summary;

    // fill ingredients
    const ingredientsList = document.getElementById("modalIngredients");
    ingredientsList.innerHTML = "";
    recipeData.extendedIngredients.forEach(ingredient => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `${ingredient.original}`;
        ingredientsList.appendChild(listItem);
    });

    // fill instructions
    const instructionsList = document.getElementById("modalInstructions");
    instructionsList.innerHTML = "";

    try {
        const stepsData = await getSteps(recipeData.id); 
        if (stepsData && stepsData.steps) {
            stepsData.steps.forEach(step => {
                const listItem = document.createElement("li");
                listItem.innerHTML = step.step;
                instructionsList.appendChild(listItem);
            });
        } else {
            instructionsList.innerHTML = "<li>No instructions available</li>"; 
        }
    } catch (error) {
        console.error("Error fetching steps:", error);
        instructionsList.innerHTML = "<li>Error loading instructions</li>";
    }

    // fill nutrition
    try {
        const nutritionData = await getNutritionData(recipeData.id);
        if (nutritionData) {
            document.getElementById("modalNutrition").innerText = 
                `Calories: ${nutritionData.find(n => n.name === "Calories")?.amount || "N/A"} kcal\n` +
                `Protein: ${nutritionData.find(n => n.name === "Protein")?.amount || "N/A"} g\n` +
                `Fat: ${nutritionData.find(n => n.name === "Fat")?.amount || "N/A"} g`;
        } else {
            document.getElementById("modalNutrition").innerText = "Nutrition data unavailable";
        }
    } catch (error) {
        console.error("Error fetching nutrition data:", error);
        document.getElementById("modalNutrition").innerText = "Error loading nutrition data";
    }

    document.getElementById("recipeModal").style.display = "block";

    document.querySelector('#modalFavoriteButton').onclick = (event) => {
        addToFavorites(recipeData, event);
    };
}

document.querySelector(".close").onclick = function() {
    document.getElementById("recipeModal").style.display = "none";
};

//get steps instructions
async function getSteps(id) {
    const someUrl = `https://api.spoonacular.com/recipes/${id}/analyzedInstructions?apiKey=${apiKey}`;
    try {
        const response = await fetch(someUrl);
        const data = await response.json();
        if (data && data.length > 0) {
            return data[0]; 
        } else {
            throw new Error("No steps found for this recipe");
        }
    } catch (error) {
        console.error("Error fetching recipe steps:", error);
        return null;
    }
}

//nutrition info
async function getNutritionData(id) {
    const url = `https://api.spoonacular.com/recipes/${id}/nutritionWidget.json?apiKey=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.nutrients) {
            return data.nutrients; 
        } else {
            throw new Error("No nutrition found for this recipe");
        }
    } catch (error) {
        console.error("Error fetching nutrition data:", error);
        return null;
    }
}
