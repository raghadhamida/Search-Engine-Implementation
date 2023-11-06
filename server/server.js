import express, { response } from 'express';
import cors from 'cors';
let app = express();
app.use(cors());
const port = 3001;

import session from 'express-session';
import { default as connectMongoDBSession} from 'connect-mongodb-session';
//Fruit crawel variables
import { c, Pages, generateAdjacencyMatrix, calculatePageRank, index } from './fruitCrawler.js';
//Wiki Crawler variables
import { c2, Pages2, generateAdjacencyMatrix2, calculatePageRank2, index2 } from './webCrawler.js';

const MongoDBStore = connectMongoDBSession(session);

//Defining the location of the sessions data in the database.
var store = new MongoDBStore({
  uri: 'mongodb://127.0.0.1:27017/lab3',
  collection: 'sessions'
});
 

//Setting up the express sessions and for it to be stored in the database
app.use(session({
  secret: 'some secret key here',
  resave: true,
  saveUninitialized: false,
  store: store 
}));

//Import mongoose module
import pkg from 'mongoose';

const { connect, Types } = pkg;

app.use(express.urlencoded({extended: true}));

//View engine
app.set('views', './views');
app.set("view engine", "pug");
app.use(express.static("js"));

// Connect to the MongoDB database
connect('mongodb://127.0.0.1:27017/lab3', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


//this converts any JSON stringified string to JSON
app.use(express.json());



//Queue a URL, which starts the crawl FRUITS
c.queue('https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html');

//Queue a URL, which starts the crawl WIKI
c2.queue("https://en.wikipedia.org/wiki/Jordan");

//serve GET request for /search
app.get("/search", async (req, res, next) => {
    try {
        let searchQuery = req.query.q;
        const boost = req.query.boost === 'true';
        const limit = parseInt(req.query.limit) || 10;
        const type = req.query.type;

        let indexToUse;
        if(type == "fruit"){
            indexToUse = index;
        }
        else if(type == "personal"){
            indexToUse = index2;
        }

        console.log(indexToUse);
        let indexResults = indexToUse.search(searchQuery, {}).slice(0, limit);
        let numberOfResultsToFetch = limit - indexResults.length;

        // Fetch more results if needed to fulfill the limit
        if (numberOfResultsToFetch > 0) {
            const additionalResults = indexToUse.search(searchQuery, {}).slice(limit, limit + numberOfResultsToFetch);
            indexResults = indexResults.concat(additionalResults);
        }

        let modifiedResults = indexResults.map(async (indexResult) => {
            try {
                let page;
                if(type == "fruit"){
                    page = await Pages.findById(indexResult.ref);
                }
                else if(type == "personal"){
                    page = await Pages2.findById(indexResult.ref);
                }
                let searchScore = boost ? indexResult.score * page.pr : indexResult.score;
                return {
                    title: page.title,
                    url: page.url,
                    content: page.content,
                    pr: page.pr,
                    searchScore: searchScore,
                    score: indexResult.score, // Add the normal score for reference
                };
            } catch (err) {
                console.log("Error finding document with query result ID: " + err);
                throw err; // Propagate the error to be caught by the catch block below
            }
        });

        let finalResults = await Promise.all(modifiedResults);

        // Sort finalResults based on searchScore if boost is true, otherwise sort based on score
        if (boost) {
            finalResults.sort((a, b) => b.searchScore - a.searchScore);
        } else {
            finalResults.sort((a, b) => b.score - a.score);
        }
        
        res.json(finalResults);
        res.status(200);
    } catch (err) {
        console.log("Error processing search request: " + err);
        res.status(500).send('Internal server error.');
    }
});

//Getting one page
app.get("/page", async (req, res) => {
    try{
        let pageURL = req.query.url;
        let type = req.query.type;
        
        let ps;
        if(type == "fruit"){
            ps = Pages;
        }
        else {
            ps = Pages2;
        }

        ps.findOne({url: pageURL})
        .then((resultPage) => {
            console.log(resultPage);
            res.status(200);
            res.send(resultPage);
        });
    } catch (err) {
        console.log("Error with page search: ", err);
        res.status(500);
    }
});

//Fruit drain
c.on('drain',async function(){
    console.log("\n CRAWLING COMPLETED. \n");

    const pages = await Pages.find();
    //console.log(pages);

    // Generate adjacency matrix
    const adjacencyMatrix = generateAdjacencyMatrix(pages);

    // Calculate PageRank values
    const x0 = calculatePageRank(adjacencyMatrix);

    // Update pages in the database with their PageRank scores
    for (let i = 0; i < pages.length; i++) {
        pages[i].pr = x0.get(0, i);
        await pages[i].save(); // Save the updated page with the PageRank score
    }

    // Sort pages based on PageRank values
    const rankedPages = pages
        .filter(page => page.pr !== undefined && page.pr !== null) // Filter out undefined or null values
        .sort((a, b) => b.pr - a.pr);
    //console.log(pages);
    // Print top 25 pages with their ranks and URLs
    //console.log("Top 25 Pages by PageRank:");
    for (let i = 0; i < 25; i++) {
        console.log(`#${i + 1}. (${rankedPages[i].pr.toFixed(10)}) ${rankedPages[i].url}`);
    }
});

//Wiki drain
c2.on('drain',async function(){
    console.log("\n WIKI CRAWLING COMPLETED. \n");

    const pages = await Pages2.find();
    //console.log(pages);

    // Generate adjacency matrix
    const adjacencyMatrix = generateAdjacencyMatrix2(pages);

    // Calculate PageRank values
    const x0 = calculatePageRank2(adjacencyMatrix);

    // Update pages in the database with their PageRank scores
    for (let i = 0; i < pages.length; i++) {
        pages[i].pr = x0.get(0, i);
        await pages[i].save(); // Save the updated page with the PageRank score
    }

    // Sort pages based on PageRank values
    const rankedPages = pages
        .filter(page => page.pr !== undefined && page.pr !== null) // Filter out undefined or null values
        .sort((a, b) => b.pr - a.pr);
    // Print top 25 pages with their ranks and URLs
    //console.log("Top 25 Pages by PageRank:");
    for (let i = 0; i < 25; i++) {
        console.log(`#${i + 1}. (${rankedPages[i].pr.toFixed(10)}) ${rankedPages[i].url}`);
    }


    console.log(index2);
    // Start the express server after crawling and PageRank calculation is completed
    app.listen(port);
    console.log("Listening on port 3001.");
    putReq(); //Send put request
});

const putReq = () => {
    fetch('http://134.117.130.17:3000/searchengines', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            request_url : "http://134.117.135.155:3001"
        }
    })
    .then(res => {
        if(res.ok){
            console.log('PUT request successful.');
        }
        else{
            console.error('PUT request FAILED: ' + response.status);
        }
    })
    .catch(err => {
        //console.error('Request Failed: ' + err);
    });
}