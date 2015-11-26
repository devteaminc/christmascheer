require('dotenv').load();
var http = require('http'); 
var express = require('express');  
var sentiment = require('sentiment');
var app = express();  
var twitter = require('twitter');
var server = http.createServer(app).listen(process.env.PORT || 5000);
var io = require('socket.io').listen(server);

// twitter credentials - loaded from .env file when local
var client = new twitter({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token_key: process.env.access_token,
  access_token_secret: process.env.access_token_secret
});

// routing for homepage
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// routing for every other request
app.get(/^(.+)$/, function(req, res) { 
  res.sendFile(__dirname + req.params[0]); 
});

// open socket connection
io.on('connection', function (socket){

  // array of terms to trackList
  var trackList = 'christmas';

  // open stream to Twitter
  client.stream('statuses/filter', {track: trackList}, function(stream) {
    stream.on('data', function(tweet) {
      var tweetSentiment = sentiment(tweet.text);

      // emit streamed results to frontend socket
      io.emit('stream',{
        tweet: tweet,
        sentiment: tweetSentiment
      });
    });
   
    stream.on('error', function(error) {
      throw error;
    });
  });
});