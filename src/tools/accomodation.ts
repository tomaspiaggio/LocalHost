import { Request, Response } from 'express';

/**
 * Represents a hotel/accommodation listing
 */
interface AccommodationListing {
    name: string;
    rating: number;
    reviews: number;
    address: string;
    priceLevel?: number;
    reviewExcerpts?: string[]; 
}

/**
 * Response format for accommodation search
 */
interface AccommodationResponse {
    success: boolean;
    message: string;
    results: AccommodationListing[];
}

/**
 * Search parameters
 */
export interface AccommodationSearchParams {
    city: string;
    checkIn?: string;
    checkOut?: string;
    priceLevel?: number; // 1: Budget, 2: Moderate, 3: Expensive, 4: Luxury
    guests?: number;
}

/**
 * Search for accommodations using Google Places API
 */
export async function accomodation(city: string, priceLevel: number) {
    // Get location coordinates
    console.log(`Fetching coordinates for city: ${city}`);
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const geoResponse = await fetch(geocodeUrl);
    const geoData = await geoResponse.json();

    console.log('Geocoding API response status:', geoResponse.status);
    console.log('Geocoding data:', JSON.stringify(geoData, null, 2));

    if (!geoData.results?.[0]?.geometry?.location) {
        console.error('Location not found in geocoding response');
        throw new Error(`Location not found for city: ${city}`)
    }

    const { lat, lng } = geoData.results[0].geometry.location;
    console.log(`Coordinates found: ${lat}, ${lng}`);

    // Search for hotels
    console.log('Searching for accommodations...');
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=lodging${priceLevel ? `&maxprice=${priceLevel}` : ''}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    console.log('Places API response status:', searchResponse.status);
    console.log('Number of results:', searchData.results?.length || 0);

    if (!searchData.results || searchData.results.length === 0) {
        console.warn('No accommodations found');
        throw new Error(`No accommodations found in ${city}`)
    }

    // Get detailed place information including reviews for each result
    const listings = await Promise.all(searchData.results.slice(0, 5).map(async place => {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,user_ratings_total,vicinity,price_level,reviews&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        return {
            name: place.name,
            rating: place.rating || 0,
            reviews: place.user_ratings_total || 0,
            address: place.vicinity,
            priceLevel: place.price_level,
            reviewExcerpts: detailsData.result?.reviews?.slice(0, 3).map(review => review.text) || []
        };
    }));

    console.log('Successfully found accommodations:', listings);

    return {message: `Found ${listings.length} accommodations in ${city}`, results: listings}
}