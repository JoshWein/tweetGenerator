# tweetGenerator
Website application for the sentence generator.

Hosted at: http://tweetgenerator-jwein.rhcloud.com/

The application won't run locally unless you have the backend setup and accessible by the application.

## Files
* Report.pdf - Written report for assignment.
* index.html - Main webpage for application.
* js/scripts.js - Contains all the main scripts for generating the sentences.
* scripts/getSentences.php - Main backend script that responding to topic requests and returns the matching list of sentences.
* scripts/TweetGeneratorProcessingHelper.java - Small program to read in the 1.6 million tweets and remove the beginning of each line to get the raw tweets.
* scripts/uploadToDB.php - Base program for parsing tweets and updating the database. This specific script was for reading in the 1.6ish million tweets and putting them in the database.
* scripts/configFileFunctions.php - Library for connecting to a mysql server and for getting config file data.
* scripts/test.php & scripts/TwitterAPIExchange.php - Files for trying to use the Twitter API for the project.
