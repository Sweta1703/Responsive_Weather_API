class WeatherApp {
    constructor() {
        // No API key required for Open-Meteo
        this.BASE_URL = 'https://api.open-meteo.com/v1';
        this.GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1';
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.locationInput = document.getElementById('locationInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.currentLocationBtn = document.getElementById('currentLocationBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.weatherDisplay = document.getElementById('weatherDisplay');
        
        // Weather display elements
        this.cityName = document.getElementById('cityName');
        this.currentDate = document.getElementById('currentDate');
        this.weatherIcon = document.getElementById('weatherIcon');
        this.currentTemp = document.getElementById('currentTemp');
        this.weatherDesc = document.getElementById('weatherDesc');
        this.feelsLike = document.getElementById('feelsLike');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.pressure = document.getElementById('pressure');
        this.visibility = document.getElementById('visibility');
        this.uvIndex = document.getElementById('uvIndex');
        this.sunrise = document.getElementById('sunrise');
        this.sunset = document.getElementById('sunset');
    }

    attachEventListeners() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.currentLocationBtn.addEventListener('click', () => this.getCurrentLocation());
        this.locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
    }

    showLoading() {
        this.hideAllSections();
        this.loadingSpinner.classList.remove('hidden');
    }

    showError(message) {
        this.hideAllSections();
        this.errorMessage.querySelector('p').textContent = message;
        this.errorMessage.classList.remove('hidden');
    }

    showWeather() {
        this.hideAllSections();
        this.weatherDisplay.classList.remove('hidden');
    }

    hideAllSections() {
        this.loadingSpinner.classList.add('hidden');
        this.errorMessage.classList.add('hidden');
        this.weatherDisplay.classList.add('hidden');
    }

    async handleSearch() {
        const location = this.locationInput.value.trim();
        if (!location) {
            this.showError('Please enter a city name');
            return;
        }

        try {
            this.showLoading();
            const coordinates = await this.geocodeLocation(location);
            const weatherData = await this.fetchWeatherByCoords(coordinates.latitude, coordinates.longitude);
            this.displayWeather(weatherData, coordinates.name, coordinates.country);
        } catch (error) {
            this.showError(error.message);
        }
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }

        this.showLoading();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const weatherData = await this.fetchWeatherByCoords(latitude, longitude);
                    const locationName = await this.reverseGeocode(latitude, longitude);
                    this.displayWeather(weatherData, locationName.name, locationName.country);
                } catch (error) {
                    this.showError(error.message);
                }
            },
            (error) => {
                let message = 'Unable to retrieve your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information is unavailable';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out';
                        break;
                }
                this.showError(message);
            }
        );
    }

    async geocodeLocation(location) {
        const response = await fetch(
            `${this.GEOCODING_URL}/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
        );
        
        if (!response.ok) {
            throw new Error('Failed to find location');
        }
        
        const data = await response.json();
        if (!data.results || data.results.length === 0) {
            throw new Error('Location not found');
        }
        
        return data.results[0];
    }

    async reverseGeocode(lat, lon) {
        try {
            const response = await fetch(
                `${this.GEOCODING_URL}/search?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    return data.results[0];
                }
            }
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
        }
        
        return { name: 'Current Location', country: '' };
    }

    async fetchWeatherByCoords(lat, lon) {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
            daily: 'sunrise,sunset,uv_index_max',
            timezone: 'auto'
        });

        const response = await fetch(`${this.BASE_URL}/forecast?${params}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }
        
        return await response.json();
    }

   getWeatherDescription(weatherCode, isDay) {
        const weatherCodes = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            71: 'Slight snow fall',
            73: 'Moderate snow fall',
            75: 'Heavy snow fall',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with slight hail',
            99: 'Thunderstorm with heavy hail'
        };
        
        return weatherCodes[weatherCode] || 'Unknown';
    }

    getWeatherIcon(weatherCode, isDay) {
        // Simple weather icon mapping
        const iconMap = {
            0: isDay ? '☀️' : '🌙',
            1: isDay ? '🌤️' : '🌙',
            2: '⛅',
            3: '☁️',
            45: '🌫️',
            48: '🌫️',
            51: '🌦️',
            53: '🌦️',
            55: '🌧️',
            61: '🌧️',
            63: '🌧️',
            65: '⛈️',
            71: '🌨️',
            73: '❄️',
            75: '❄️',
            80: '🌦️',
            81: '🌧️',
            82: '⛈️',
            95: '⛈️',
            96: '⛈️',
            99: '⛈️'
        };
        
        return iconMap[weatherCode] || '❓';
    }

    displayWeather(data, cityName, country) {
        const { current, daily } = data;
        
        // Update basic info
        this.cityName.textContent = `${cityName}${country ? ', ' + country : ''}`;
        this.currentDate.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Update weather icon and temperature
        const weatherIcon = this.getWeatherIcon(current.weather_code, current.is_day);
        this.weatherIcon.textContent = weatherIcon;
        this.weatherIcon.style.fontSize = '4rem';
        
        this.currentTemp.textContent = Math.round(current.temperature_2m);
        this.weatherDesc.textContent = this.getWeatherDescription(current.weather_code, current.is_day);
        this.feelsLike.textContent = `Feels like ${Math.round(current.apparent_temperature)}°C`;

        // Update weather details
        this.humidity.textContent = `${current.relative_humidity_2m}%`;
        this.windSpeed.textContent = `${current.wind_speed_10m} km/h`;
        this.pressure.textContent = `${current.pressure_msl} hPa`;
        this.visibility.textContent = 'N/A'; // Not provided by Open-Meteo
        this.uvIndex.textContent = daily.uv_index_max[0] || 'N/A';
        
        // Format sunrise and sunset times
        this.sunrise.textContent = this.formatTime(daily.sunrise[0]);
        this.sunset.textContent = this.formatTime(daily.sunset[0]);

        this.showWeather();
    }

    formatTime(isoString) {
        return new Date(isoString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});