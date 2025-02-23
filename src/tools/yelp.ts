export async function yelp(location = 'Buenos Aires', term = 'food', sortBy = 'best_match', limit = 3) {
    const url = new URL('https://api.yelp.com/v3/businesses/search');

    if (location) url.searchParams.append('location', location);
    if (term) url.searchParams.append('term', term);
    if (sortBy) url.searchParams.append('sort_by', sortBy);
    if (limit) url.searchParams.append('limit', limit.toString());

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            authorization: `Bearer ${process.env.YELP_API_KEY}`
        }
    };

    try {
        const rawResponse = await fetch(url.toString(), options);
        if (!rawResponse.ok) throw new Error(`HTTP error! status: ${rawResponse.status}`);

        const response = await rawResponse.json();

        return response.businesses.map(e => ({
            name: e.name,
            imageUrl: e.image_url,
            url: e.url,
            categories: e.categories,
            rating: e.rating,
            location: e.location
        }))
    } catch (error) {
        console.error("Error fetching Yelp data:", error);
        throw error;
    }
}