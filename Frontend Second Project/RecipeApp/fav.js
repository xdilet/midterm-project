// api
const apiKey = 'f1965a9453bb438cb684eb05f0477f08';

//toast
function showToast(message, type = 'default') {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    
    toast.className = "toast";
    
    if (type === "success") {
        toast.classList.add("toast-success", "show");
    } else if(type == 'error'){
        toast.classList.add("toast-error", "show");
    }else {
        toast.className = "toast show";
    }

    setTimeout(() => { toast.className = "toast"; }, 3000);
}

//display recipes
function renderFavorites() {
    const recipeGrid = document.querySelector('#recipeGrid');
    
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    recipeGrid.innerHTML = ""; 

    favorites.forEach(recipe => {
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("recipe-card");

        recipeCard.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.title}">
            <h3>${recipe.title}</h3>
            <p>${recipe.description}</p>
            <p>Ready in ${recipe.time} mins</p>
            <button class="favorite-button" onclick="removeFromFavorites(${recipe.id}, event)">
               Remove from favorite
            </button>
        `;

        recipeCard.addEventListener("click", async () => {
            const recipeData = await getRecipeDetails(recipe.id); 
            if (recipeData) openModal(recipeData); 
        });

        recipeGrid.appendChild(recipeCard);
    });
}


//remove button logic
async function removeFromFavorites(recipeId, event) {
    event.stopPropagation();
    
    let fav = JSON.parse(localStorage.getItem('favorites')) || [];
    fav = fav.filter(f => f.id !== recipeId);    
    localStorage.setItem('favorites', JSON.stringify(fav));
    showToast("This recipe was deleted", "success");
    renderFavorites();
}



//Listening to the storage event to refresh the favorites page
window.addEventListener("storage", (event) => {
    if (event.key === "favorites") {
        renderFavorites(); 
    }
});

//get details
async function getRecipeDetails(id) {
    const url = `https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`;
    try {
        const response = await fetch(url);
        const recipeData = await response.json();
        return recipeData;
    } catch (error) {
        console.error("Error fetching recipe:", error);
        return null;
    }
}

// open modal 
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

    // fill instruction
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
            `   Calories: ${nutritionData.find(n => n.name === "Calories").amount} kcal
                Protein: ${nutritionData.find(n => n.name === "Protein").amount} g
                Fat: ${nutritionData.find(n => n.name === "Fat").amount} g`;
        } else {
            document.getElementById("modalNutrition").innerText = "Nutrition data unavailable";
        }
    } catch (error) {
        console.error("Error fetching Nutrition data:", error);
        document.getElementById("modalNutrition").innerText = "Error loading nutrition data";
    }

    //show model
    document.getElementById("recipeModal").style.display = "block";

    //remove button
    document.querySelector('#modalFavoriteButton').onclick = (event) => {
        document.getElementById("recipeModal").style.display = 'none';
        removeFromFavorites(recipeData.id, event);
    };

}

//close model 
document.querySelector(".close").onclick = function() {
    document.getElementById("recipeModal").style.display = "none";
};

// get instruction
async function getSteps(id) {
    const someUrl = `https://api.spoonacular.com/recipes/${id}/analyzedInstructions?apiKey=${apiKey}`;
    try {
        const response = await fetch(someUrl);
        const data = await response.json();
        if (data && data.length > 0) {
            return data[0]; // Возвращаем первые инструкции
        } else {
            throw new Error("No steps found for this recipe");
        }
    } catch (error) {
        console.error("Error fetching recipe steps:", error);
        return null;
    }
}

// get nutrition info
async function getNutritionData(id) {
    const url = `https://api.spoonacular.com/recipes/${id}/nutritionWidget.json?apiKey=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.nutrients) {
            return data.nutrients; // Возвращаем массив с питательными веществами
        } else {
            throw new Error("No nutrition found for this recipe");
        }
    } catch (error) {
        console.error("Error fetching nutrition data:", error);
        return null;
    }
}

// call when the page loads
renderFavorites();
