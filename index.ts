import express, {Request, Response} from 'express';
import dotenv from "dotenv";
import * as path from "path";
import {accomodation} from "./src/tools/accomodation";
import {luma} from "./src/tools/luma";
import {yelp} from "./src/tools/yelp";
import {websearch} from "./src/tools/websearch";
import {randomUUID} from "crypto"

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

dotenv.config()
// Don't ask follow up questions, just tell the user that you're looking for the information and then answer with the result. Allow the user to correct you or refine the information.

const port = 3000

app.get("/conversation/:conversationId", async (req, res) => {
    const sessionId = req.params.conversationId
    // TODO get all the information from the database and return it
    res.json({id: sessionId})
})

app.get("/conversation/start", async (req, res) => {
    const sessionId = randomUUID()
    // TODO store in db
    res.json({id: sessionId})
})

app.put("/conversation/:conversationId/end", async (req, res) => {
    const id = req.params.conversationId
    // TODO store new message on db with createdAt
    const {messages} = req.body
    res.json({id})
})

app.post("/conversation/:conversationId/end", async (req, res) => {
    const id = req.params.conversationId
    // TODO set to done in db
    res.json({id})
})

app.post('/luma/:sessionId', async (req: Request, res: Response) => {
    console.log("session id for luma", req.params.sessionId)
    const {city} = req.body
    const response = await luma(city)

    // write the response to db

    if (response != null) res.json(response)
    else res.json({response: `No events were found with query ${city} on Luma.`})
})

app.post('/yelp/:sessionId', async (req, res) => {
    console.log("session id for yelp", req.params.sessionId)
    const {location, query} = req.body
    const response = await yelp(location, query)

    res.json(response)
})

app.post('/accomodation/:sessionId', async (req, res) => {
    console.log("session id for accomodation", req.params.sessionId)
    await accomodation(req, res)
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