import express, {Request, Response} from 'express';
import dotenv from "dotenv";
import * as path from "path";
import {accomodation} from "./src/tools/accomodation";
import {luma} from "./src/tools/luma";
import {yelp} from "./src/tools/yelp";
import {websearch} from "./src/tools/websearch";
import {randomUUID} from "crypto"
const cors = require('cors');

dotenv.config()

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares
if (process.env.DEBUG != null) app.use(cors({origin: '*'}));

let data = []

// Don't ask follow up questions, just tell the user that you're looking for the information and then answer with the result. Allow the user to correct you or refine the information.

const port = 3000

app.get("/conversation/start", async (req, res) => {
    const sessionId = randomUUID()
    console.log(`started conversation with id ${sessionId}`)
    res.json({id: sessionId})
})

app.put("/conversation/:conversationId", async (req, res) => {
    const id = req.params.conversationId
    const {messages} = req.body
    console.log("received messages from the frontend", messages)
    res.json({id})
})

app.post("/conversation/:conversationId/end", async (req, res) => {
    const id = req.params.conversationId
    // TODO set to done in db
    res.json({id})
})

app.get("/conversation/:conversationId", async (req, res) => {
    const sessionId = req.params.conversationId
    res.json({id: sessionId, data})
})

app.post('/luma/:sessionId', async (req: Request, res: Response) => {
    const sessionId = req.params.sessionId;
    console.log("session id for luma", sessionId)
    const {city} = req.body
    const response = await luma(city)

    data = [{type: "luma", ...response}, ...data]

    if (response != null) res.json(response)
    else res.json({response: `No events were found with query ${city} on Luma.`})
})

app.post('/yelp/:sessionId', async (req, res) => {
    const sessionId = req.params.sessionId;
    console.log("session id for yelp", sessionId)
    const {location, query} = req.body
    const response = await yelp(location, query)

    data = [{type: "yelp", response}, ...data]

    res.json(response)
})

// @ts-ignore
app.post('/accomodation/:sessionId', async (req, res) => {
    const sessionId = req.params.sessionId;
    console.log("session id for accomodation", sessionId)
    console.log('Starting accommodation search with params:', req.body);
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


    const result = await accomodation(city, priceLevel)

    data = [{type: "accomodation", result}, ...data]

    res.json(result)
})

app.post('/websearch/:sessionId', async (req, res) => {
    const sessionId = req.params.sessionId;
    console.log("session id for websearch", sessionId)
    const {city, question, previous_context, additional_context} = req.body
    const {citations, content} = await websearch(city, question, previous_context, additional_context)
    data = [{type: "websearch", citations, content}, ...data]
    res.json({response: content})
})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})

export default app