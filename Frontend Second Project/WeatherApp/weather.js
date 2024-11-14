const apiKey = 'ebf1c867607253a98426a3d38bc55538'; 
let currentUnit = 'metric'; 

function fetchWeather(city) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${currentUnit}&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            displayWeather(data);
            fetchForecast(data.coord.lat, data.coord.lon);
        })
        .catch(error => alert('City not found!'));
}

function displayWeather(data) {
    document.getElementById('city-name').innerText = `${data.name}, ${data.sys.country}`;
    document.getElementById('condition').innerText = data.weather[0].description;
    document.getElementById('temperature').innerText = `${data.main.temp}°`;
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
    document.getElementById('humidity').innerText = `Humidity: ${data.main.humidity}%`;
    document.getElementById('wind-speed').innerText = `Wind: ${data.wind.speed} m/s`;
}

function fetchForecast(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            displayForecast(data.list);
        })
        .catch(error => console.error('Error fetching forecast:', error));
}

function displayForecast(forecastData) {
    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = '';  

    for (let i = 0; i < forecastData.length; i += 8) {  
        const dayData = forecastData[i];
        const temp = dayData.main.temp;
        const condition = dayData.weather[0].main;
        const icon = dayData.weather[0].icon;

        const dayElement = document.createElement('div');
        dayElement.classList.add('forecast-item');
        dayElement.innerHTML = `
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Weather Icon">
            <p>${condition}</p>
            <span>${temp}°</span>
        `;
        forecastContainer.appendChild(dayElement);
    }
}

document.getElementById('search').addEventListener('click', () => {
    const city = document.getElementById('city').value;
    if (city) {
        fetchWeather(city);
    } else {
        alert('Please enter a city!');
    }
});

document.getElementById('toggle-unit').addEventListener('click', () => {
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    document.getElementById('toggle-unit').innerText = currentUnit === 'metric' ? 'Switch to Fahrenheit' : 'Switch to Celsius';
    const city = document.getElementById('city').value;
    if (city) {
        fetchWeather(city);
    }
});

document.getElementById('current-location').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
    });
});

function fetchWeatherByCoords(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            displayWeather(data);
            document.querySelector('#city').value = data.name;
            fetchForecast(lat, lon);
        })
        .catch(error => console.error('Error fetching weather by coordinates:', error));
}
