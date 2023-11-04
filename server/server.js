import express from 'express';
import cors from 'cors';
let app = express();
app.use(cors());
const port = 3001;

import session from 'express-session';
import { default as connectMongoDBSession} from 'connect-mongodb-session';
import { c, Pages, generateAdjacencyMatrix, calculatePageRank, index } from './fruitCrawler.js';

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



//Queue a URL, which starts the crawl
c.queue('https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html');


//serve GET request for /fruits
app.get("/fruits", async (req, res, next) => {
    //res.status(200).render("search.pug", {web: "Fruits Web Page"});
    res.json({message: 'reached'});
    res.status(200);
});

//serve GET request for /search
app.get("/search", async (req, res, next) => {
    try {
        // let searchQuery = req.query.q || '';
        // const boost = req.query.boost === 'true'; // Check if boosting is enabled
        // const limit = parseInt(req.query.limit) || 10; // Get the limit parameter and default to 10 if not provided
        
        let searchQuery = req.body.q;
        const boost = req.body.b === 'true';
        const limit = parseInt(req.body.l) || 10;
        
        let indexResults = index.search(searchQuery, {}).slice(0, limit);
        let numberOfResultsToFetch = limit - indexResults.length;

        // Fetch more results if needed to fulfill the limit
        if (numberOfResultsToFetch > 0) {
            const additionalResults = index.search(searchQuery, {}).slice(limit, limit + numberOfResultsToFetch);
            indexResults = indexResults.concat(additionalResults);
        }

        let modifiedResults = indexResults.map(async (indexResult) => {
            try {
                let page = await Pages.findById(indexResult.ref);
                let searchScore = boost ? indexResult.score * page.pr : indexResult.score;

                return {
                    title: page.title,
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
        
        console.log(finalResults);
        res.json(finalResults);
        res.status(200);
        // res.format({
        //     "text/html": () => {res.status(200).render("searchResults.pug", {results: finalResults})},
        //     "application/json": () => {res.status(200).json(finalResults)}
        // });
    } catch (err) {
        console.log("Error processing search request: " + err);
        res.status(500).send('Internal server error.');
    }
});

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



    // Start the express server after crawling and PageRank calculation is completed
    app.listen(port);
    console.log("Listening on port 3001.");
});
