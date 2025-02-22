import express from 'express';
import dotenv from "dotenv";
import {websearch} from "./src/websearch";
import {luma} from "./src/luma";
import {yelp} from "./src/yelp";

const app = express();
app.use(express.json());

dotenv.config()
// Don't ask follow up questions, just tell the user that you're looking for the information and then answer with the result. Allow the user to correct you or refine the information.

const port = 3000

app.post('/luma', async (req, res) => {
    await luma()
})

app.post('/yelp', async (req, res) => {
    await yelp()
})

app.post('/websearch', async (req, res) => {
    const {city, question, previous_context, additional_context} = req.body
    const {citations, content} = await websearch(city, question, previous_context, additional_context)
    res.json({response: content})
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})