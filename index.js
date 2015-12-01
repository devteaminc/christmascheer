// load environment variables
require('dotenv').load();
var http = require('http'); 
var express = require('express');
var request = require('request');  
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

function getTweetUrl(user,tweet){
  var tweetstr = "http://twitter.com/{USER}/status/{TWEET_ID}";
  return tweetstr.replace("{USER}",user).replace("{TWEET_ID}",tweet); 
}


// open socket connection
io.on('connection', function (socket){

  var lastTweetId = null;
  var totalTweets = 0;
  var totalScore = 0;
  var adjustedScore = 0;
  var positive = 0;
  var neutral = 0;
  var negative = 0;
  var positiveTweet;
  var negativeTweet;
  var startTime = Math.floor(Date.now() / 1000);


  // open stream to Twitter
  client.stream('statuses/filter', {track: 'christmas'}, function(stream) {
    stream.on('data', function(tweet) {

      /**
       * track last tweet sent so we can make sure it is only sent once
       * Twitter streaming API has a habit of sending duplicate tweets through
       */
      if(lastTweetId === null){
        lastTweetId = tweet.id_str;
      }

      if(tweet.id_str !== lastTweetId){

        var tweetSentiment = sentiment(tweet.text);
        lastTweetId = tweet.id_str;
        totalTweets += 1;
        totalScore += tweetSentiment.score;
        adjustedScore = parseFloat((totalScore / totalTweets)).toFixed(2);

        // calculate time since data started coming through
        var timenow = Math.floor(Date.now() / 1000);
        var elapsedtime = (timenow - startTime); 

        // console.log("score: " + tweetSentiment.score);
        // console.log("total: " +adjustedScore);
        // console.log("seconds: " +elapsedtime);
        // console.log(tweet.user.id_str);
        
        var positiveTweet = false;
        var negativeTweet = false;

        if(tweetSentiment.score > 0){
          positive+=1;

          if(tweetSentiment.score > 8){
            positiveTweet = true;
          }


        } else if(tweetSentiment.score < 0){
          negative+=1;

          if(tweetSentiment.score < -8){
            negativeTweet = true;
          }

        } else {
          neutral+=1;
        }

        if(positiveTweet === true || negativeTweet === true){

          var tweetstr = getTweetUrl(tweet.user.screen_name,tweet.id_str);

          //console.log(tweetstr);

          request('https://api.twitter.com/1/statuses/oembed.json?omit_script=true&url='+tweetstr, function (error, response, body) {
            if (!error && response.statusCode == 200) {

              var info = JSON.parse(body);
              var embed = info.html;

              if(positiveTweet === true){
                io.emit('positive-tweet',{
                    positiveTweet: embed
                });  
              } else {
                io.emit('negative-tweet',{
                    negativeTweet: embed
                });  
              }
            }
          });
        }
        

        // emit streamed results to frontend socket
        io.emit('scores',{
          tweet: tweet,
          sentiment: adjustedScore,
          totalTweets: totalTweets,
          positive: positive,
          neutral: neutral,
          negative: negative
        });

      } 

    });
   
    stream.on('error', function(error) {
      console.log(error);
      //throw error;
    });
  });
});