class OpenMeteo {
    constructor() {
        this.BASE_URL = 'https://api.open-meteo.com/v1/forecast';
        this.GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1';
    }

    async getWeatherData(latitude, longitude) {
        const url = `${this.BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }

        return await response.json();
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
        
        return {
            latitude: data.results[0].latitude,
            longitude: data.results[0].longitude,
            name: data.results[0].name,
            country: data.results[0].country || ''
        };
    }

    async reverseGeocode(lat, lon) {
    try {
        // Use a different approach for reverse geocoding
        // We'll use the Nominatim API (OpenStreetMap) which is free and doesn't require API key
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.county;
                const country = data.address.country;
                return { 
                    name: city || 'Current Location', 
                    country: country || '' 
                };
            }
        }
    } catch (error) {
        console.error('Reverse geocoding failed:', error);
    }
    
    return { name: 'Current Location', country: '' };
}
}