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
    reviewExcerpts?: string[]; // Added review excerpts
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
export async function searchAccommodations(params: AccommodationSearchParams): Promise<AccommodationResponse> {
    if (!params.city) {
        throw new Error('City parameter is required');
    }

    try {
        // Get location coordinates
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(params.city)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const geoResponse = await fetch(geocodeUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results?.[0]?.geometry?.location) {
            throw new Error('Location not found');
        }

        const { lat, lng } = geoData.results[0].geometry.location;

        // Search for hotels
        const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=lodging${params.priceLevel ? `&maxprice=${params.priceLevel}` : ''}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.results) {
            throw new Error('No results found');
        }

        // Get detailed place information including reviews for each result
        const detailedListings = await Promise.all(searchData.results.slice(0, 5).map(async place => {
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

        return {
            success: true,
            message: `Found ${detailedListings.length} accommodations in ${params.city}`,
            results: detailedListings
        };

    } catch (error) {
        console.error('Accommodation search error:', error);
        throw error;
    }
}

/**
 * Express route handler
 */
export async function handleAccommodationSearch(req: Request, res: Response) {
    console.log('Starting accommodation search with params:', req.body);
    
    try {
        const { city, priceLevel } = req.body;
        
        if (!city) {
            console.error('City parameter missing');
            return res.status(400).json({
                success: false,
                message: 'City parameter is required',
                results: []
            });
        }

        if (!process.env.GOOGLE_MAPS_API_KEY) {
            console.error('Google Maps API key not found in environment');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error',
                results: []
            });
        }

        // Get location coordinates
        console.log(`Fetching coordinates for city: ${city}`);
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        
        const geoResponse = await fetch(geocodeUrl);
        const geoData = await geoResponse.json();
        
        console.log('Geocoding API response status:', geoResponse.status);
        console.log('Geocoding data:', JSON.stringify(geoData, null, 2));

        if (!geoData.results?.[0]?.geometry?.location) {
            console.error('Location not found in geocoding response');
            return res.status(404).json({
                success: false,
                message: `Location not found for city: ${city}`,
                results: []
            });
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
            return res.status(404).json({
                success: false,
                message: `No accommodations found in ${city}`,
                results: []
            });
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

        return res.status(200).json({
            success: true,
            message: `Found ${listings.length} accommodations in ${city}`,
            results: listings
        });

    } catch (error) {
        console.error('Error in accommodation search:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            results: []
        });
    }
}