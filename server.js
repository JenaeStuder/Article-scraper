const express = require("express");
const mongojs = require("mongojs");
const cheerio = require("cheerio");
const axios = require("axios");
const logger = require("morgan");
const mongoose = require("mongoose");
const PORT = 3000;
const app = express();

app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

// Database configuration
const databaseUrl = "scraper";
const collections = ["scrapedData"];

// Hook mongojs configuration to the db variable
const db = mongojs(databaseUrl, collections);
db.on("error", function (error) {
    console.log("Database Error:", error);
});
app.get("/", function (req, res) {
    res.send("Hello world");
});

// Retrieve data from the db
app.get("/all", function (req, res) {
    // Find all results from the scrapedData collection in the db
    db.scrapedData.find({}, function (error, found) {
        // Throw any errors to the console
        if (error) {
            console.log(error);
        }
        // If there are no errors, send the data to the browser as json
        else {
            res.json(found);
        }
    });
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function (req, res) {
    // Make a 

    axios.get("https://www.beautylish.com/articles").then(function (response) {

        // Load the HTML into cheerio and save it to a variable
        // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
        const $ = cheerio.load(response.data);

       

        // With cheerio, find each p-tag with the "title" class
        // (i: iterator. element: the current element)
        $("div.body").each(function (i, element) {

            const results = {};

            // Save the text of the element in a "title" variable
            results.title = $(this).find("h3").text();

            // In the currently selected element, look at its child elements (i.e., its a-tags),
            // then save the values for any "href" attributes that the child elements may have
            results.link = $(this).find("a").attr("href");
            results.summary = $(this).find("p.type_small").text();
            
           
            db.Article.create(result)
            .then(function(dbArticle) {
              // View the added result in the console
              console.log(dbArticle);
            })
            .catch(function(err) {
              // If an error occurred, log it
              console.log(err);
            });
        });
    
        // Send a message to the client
        res.send("Scrape Complete");
      });
    });
    app.get("/articles", function(req, res) {
        // Grab every document in the Articles collection
        db.Article.find({})
          .then(function(dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
          });
      });
      
      // Route for grabbing a specific Article by id, populate it with it's note
      app.get("/articles/:id", function(req, res) {
        // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
        db.Article.findOne({ _id: req.params.id })
          // ..and populate all of the notes associated with it
          .populate("note")
          .then(function(dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
          });
      });
      
      // Route for saving/updating an Article's associated Note
      app.post("/articles/:id", function(req, res) {
        // Create a new note and pass the req.body to the entry
        db.Note.create(req.body)
          .then(function(dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
          })
          .then(function(dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
          });
      });


// Listen on port 3000
app.listen(PORT, function () {
    console.log("App running on port" + PORT + "!");
});
