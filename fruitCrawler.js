
import crawler from 'crawler';
import {Matrix} from "ml-matrix";

import elasticlunr from 'elasticlunr';

//Create your index
//Specify fields you want to include in search
//Specify reference you want back (i.e., page ID)
const index = elasticlunr(function () {
    this.addField('title');
    this.addField('content');
    this.addField('url');
    this.addField('pr');
    this.addField('searchScore');
    this.setRef('id');
});

let crawledPages = new Set();
let pagesQueue = new Set();


//importing collections
import Pages from './collections/pages.js';



const c = new crawler({
    maxConnections : 10, //use this for parallel, rateLimit for individual
    //rateLimit: 1000,

    // This will be called for each crawled page
    callback: async function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            let url = res.options.uri; //this is the url of the page we're crawling 
            //console.log(url);
            if (crawledPages.has(url)){ //this page has been visited before, so skip it 
                //console.log("Visited this page before: " + url );
                return;
            }else{ //this means that the page hasn't been visited before, so extract and process data 
                
                crawledPages.add(url);
                let $ = res.$; //get cheerio data, see cheerio docs for info
                let content = $('p').text(); //this is all the fruits 
                let title = $('title').text();
                let links = $("a") //get all links from page
                let outgoingLinks = [];
                $(links).each(function(i, link){
                    let linkText = $(link).text();
                    let completeLink = " https://people.scs.carleton.ca/~davidmckenney/fruitgraph/" + linkText + ".html";
                    //console.log("Complete link: " + completeLink);
                    outgoingLinks.push(completeLink);
                });


                for (const outgoingLink of outgoingLinks) {
                    if (!pagesQueue.has(outgoingLink)) {
                        c.queue(outgoingLink);
                        pagesQueue.add(outgoingLink);
                        //console.log(outgoingLink + " added to queue");
                    }
    
                    try {
                        await Pages.findOneAndUpdate(
                            { url: outgoingLink },
                            { $addToSet: { incomingLinks: url } },
                            { upsert: true }
                        );
                        //console.log(url + " added to list of incoming links of " + outgoingLink);
                    } catch (err) {
                        console.log("Error updating incomingLinks: " + err);
                    }
                }
    
                try {
                    const updatedPage = await Pages.findOneAndUpdate(
                        { url: url },
                        { $set: { title: title, content: content, outGoingLinks: outgoingLinks } },
                        { upsert: true, new: true },
                    );
                    
                    index.addDoc({
                        id: updatedPage._id,  // Using the database ID as the reference
                        title: title,
                        content: content,
                        url: url
                    });
                    
                    //console.log("Page updated:", updatedPage);
                } catch (err) {
                    console.log("Error creating/updating document for " + url + ": " + err);
                }

            }
            
        }
        done();
    },
});

c.on("error", function (error) {
    console.error("Crawler error:", error);
});



function generateAdjacencyMatrix(pages) {
    //console.log(pages);
    const n = pages.length;
    console.log("Number of pages:", n);
    const adjacencyMatrix = Matrix.zeros(n, n);
    
    //console.log("Adjacency Matrix:", adjacencyMatrix);
    pages.forEach((page, i) => {
        page.outGoingLinks.forEach((link) => {
            const j = pages.findIndex((p) => p.url === link);
            if (j !== -1) {
                adjacencyMatrix.set(i, j, 1); // There is a link from page i to page j
            }
        });
    });

  
    //console.log(adjacencyMatrix.getRow(0));
    return adjacencyMatrix;
}


function calculatePageRank(adjacencyMatrix, alpha = 0.1, epsilon = 0.0001) {
    const n = adjacencyMatrix.rows;
    
    //x0 vector matrix 
    let x0 = new Matrix(1, n);
    x0.set(0, 0, 1);
    for (let i = 1; i < n; i++){
        x0.set(0, i, 0);
    }

    for (let i = 0; i < n; i++) {
        const row = adjacencyMatrix.getRow(i);
        const onesCount = row.reduce((count, element) => count + element, 0);
    
        if (onesCount === 0) {
          // If the row has no 1s, replace each element by 1/N
          for (let j = 0; j < n; j++) {
            adjacencyMatrix.set(i, j, 1 / n);
          }
        } else {
          // If the row has 1s, divide each 1 by the number of 1s in that row
          for (let j = 0; j < n; j++) {
            if (row[j] === 1) {
                adjacencyMatrix.set(i, j, 1 / onesCount);
            }
          }
        }
    }

    //multiply adjacencyMatrix by (1 - alpha)
    adjacencyMatrix.mul(1-alpha); 

    //Add alpha/N to each entry	of the adjacencyMatrix
    for (let i = 0; i < n; i++){
        for (let j = 0; j < n; j++){
            let currValue = adjacencyMatrix.get(i, j);
            adjacencyMatrix.set(i, j, currValue + (alpha/n));
        }
    }

    //console.log(adjacencyMatrix);

    //implementation of the power iteration
    let iteration = 1;
    let oldX0;

    do {
        oldX0 = x0.clone();
        x0 = x0.mmul(adjacencyMatrix);

        let difference = x0.clone().sub(oldX0);
        let euclideanDist = difference.norm();

        if(euclideanDist < epsilon) {
            console.log("Stopped at iteration #" + iteration + "\n");
            break;
        }

        iteration++;
    } while (true);

    

    return x0;


}



export { c, Pages, generateAdjacencyMatrix, calculatePageRank, index };

