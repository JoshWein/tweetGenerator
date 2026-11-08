# tweetGenerator
Website application for the sentence generator.

Originally hosted on OpenShift (rhcloud, shut down in 2017) with a MySQL backend. It now runs on Vercel: the page is static and `api/sentences.js` is a serverless function that searches `data/tweets.txt.gz`.

## Corpus
`data/tweets.txt.gz` is the Sentiment140 training set (1.6 million tweets) filtered the same way the original upload script did: no retweets, links or @mentions, then de-duplicated. The **Build tweet corpus** GitHub Action (`scripts/build_corpus.py`) downloads and rebuilds it; you can also run `python3 scripts/build_corpus.py path/to/trainingandtestdata.zip` locally.

## Running locally
`npx vercel dev`, then open http://localhost:3000.

## Files
* Report.pdf - Written report for assignment.
* index.html - Main webpage for application.
* js/scripts.js - Contains all the main scripts for generating the sentences.
* api/sentences.js - Serverless function that returns the tweets containing a topic.
* scripts/build_corpus.py - Builds data/tweets.txt.gz from Sentiment140.
* scripts/getSentences.php - Original (retired) backend script that responding to topic requests and returns the matching list of sentences.
* scripts/TweetGeneratorProcessingHelper.java - Small program to read in the 1.6 million tweets and remove the beginning of each line to get the raw tweets.
* scripts/uploadToDB.php - Base program for parsing tweets and updating the database. This specific script was for reading in the 1.6ish million tweets and putting them in the database.
* scripts/configFileFunctions.php - Library for connecting to a mysql server and for getting config file data.
* scripts/test.php & scripts/TwitterAPIExchange.php - Files for trying to use the Twitter API for the project.
