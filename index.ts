import express from 'express';
import dotenv from "dotenv";
import {websearch} from "./src/websearch";
import {luma} from "./src/luma";
import {yelp} from "./src/yelp";
import {airbnb} from "./src/airbnb";

const app = express();
app.use(express.json());

dotenv.config()
// Don't ask follow up questions, just tell the user that you're looking for the information and then answer with the result. Allow the user to correct you or refine the information.

const port = 3000

app.post('/luma/:sessionId', async (req, res) => {
    console.log("session id for luma", req.params.sessionId)
    const {city} = req.body
    const response = await luma(city)

    // write the response to db

    if (response != null) return res.json(response)
    return res.json({response: `No events were found with query ${city} on Luma.`})
})

app.post('/yelp/:sessionId', async (req, res) => {
    console.log("session id for yelp", req.params.sessionId)
    await yelp()
})

app.post('/airbnb/:sessionId', async (req, res) => {
    console.log("session id for airbnb", req.params.sessionId)
    await airbnb()
})

app.post('/websearch/:sessionId', async (req, res) => {
    console.log("session id for websearch", req.params.sessionId)
    const {city, question, previous_context, additional_context} = req.body
    const {citations, content} = await websearch(city, question, previous_context, additional_context)
    res.json({response: content})
})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})