export async function websearch(city: string, question: string, previousContext: string, additionalContext: string): Promise<{
    citations: string[],
    content: string
}> {
    const responseBody = {
        model: "sonar",
        messages: [{
            role: "system",
            content: "Be precise and concise."
            // content: "Be precise and concise. Optimize for conciseness while retaining key information. The users " +
            //     "will ask for recommendations. Limit the amount of answers to three. Only provide name, location and " +
            //     "a five word description."
        }, {role: "user", content: `The user has asked the following question: "${question}" about the city "${city}".
        Previously you recommended: ${previousContext}.
        Also, the user added additional details: ${additionalContext}`}],
        max_tokens: 1024,
        temperature: 0.2,
        top_p: 0.9,
        search_domain_filter: null,
        return_images: false,
        return_related_questions: false,
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1,
        response_format: null
    }

    const rawResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {Authorization: `Bearer ${process.env.PERPLEXITY_KEY}`, 'Content-Type': 'application/json'},
        body: JSON.stringify(responseBody)
    })
    const response = await rawResponse.json()

    // console.log("query from 11labs", req.body)
    // console.log("response from perplexity", response.citations, response.choices[0].message.content)
    return {citations: response.citations, content: response.choices[0].message.content}
}