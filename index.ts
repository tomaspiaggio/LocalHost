import express from 'express';
import dotenv from "dotenv";

const app = express();
app.use(express.json());

dotenv.config()
// Don't ask follow up questions, just tell the user that you're looking for the information and then answer with the result. Allow the user to correct you or refine the information.

const port = 3000

app.post('/luma', async (req, res) => {

    fetch("https://api.lu.ma/search/get-results?query=san+")
})


app.post('/websearch', async (req, res) => {

    const {city, question, previous_context, additional_context} = req.body

    const responseBody = {
        model: "sonar",
        messages: [{
            role: "system",
            content: "Be precise and concise."
            // content: "Be precise and concise. Optimize for conciseness while retaining key information. The users " +
            //     "will ask for recommendations. Limit the amount of answers to three. Only provide name, location and " +
            //     "a five word description."
        }, {role: "user", content: `The user has asked the following question: "${question}" about the city "${city}".
        Previously you recommended: ${previous_context}.
        Also, the user added additional details: ${additional_context}`}],
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

    console.log("query from 11labs", req.body)
    console.log("response from perplexity", response.citations, response.choices[0].message.content)
    res.json({"response": response.choices[0].message.content})
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})