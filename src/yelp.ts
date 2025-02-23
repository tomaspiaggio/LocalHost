async function yelp({ location = 'Buenos Aires', term = 'food', sortBy = 'best_match', limit = 3 } = {}) {
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
        const response = await fetch(url.toString(), options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching Yelp data:", error);
        throw error;
    }
}

yelp({ location: 'New York', term: 'pizza'})
    .then(data => console.log(data))
    .catch(err => console.error(err));
