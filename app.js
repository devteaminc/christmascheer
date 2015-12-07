// load NPM based modules
require('dotenv').load(); // load environment variables
var http = require('http'); 
var express = require('express');
var path = require('path');
var request = require('request');  
var favicon = require('serve-favicon');  
var sentiment = require('sentiment');
var app = express();  
var twitter = require('node-tweet-stream');
var server = http.createServer(app).listen(process.env.PORT || 5000);
var io = require('socket.io').listen(server);

// load my modules
var spamtweet = require('./modules/spamtweet');

// routes
var routes = require('./routes/index');

// views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// favicon and static asset serving
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.png')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
module.exports = app;

// utility vars
var tweeturl = "http://twitter.com/{USER}/status/{TWEET_ID}";
var embedurl = "https://api.twitter.com/1/statuses/oembed.json?conversation=none&omit_script=true&url=";
var trackingTerm = "christmas";

// init counter vars
var lastTweetId = null;
var totalTweets = 0;
var totalScore = 0;
var adjustedScore = 0;
var positive = 0;
var neutral = 0;
var negative = 0;
var startTime = Math.floor(Date.now() / 1000);

// threshold vars (pretty arbitrary settings)
var positiveThreshold = 6;
var negativeThreshold = -5;

// twitter credentials - loaded from .env file when local
var tw = new twitter({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  token: process.env.access_token,
  token_secret: process.env.access_token_secret
});

// track christmas
tw.track(trackingTerm);

// error
tw.on('error', function (err) {
  console.log(err);
});

// tweet event
tw.on('tweet',function(tweet){

   // track last tweet sent so we can make sure it is only sent once
   // Twitter streaming API has a habit of sending duplicate tweets through
  if(lastTweetId === null){
    lastTweetId = tweet.id_str;
  }

  // check tweet against various spam parameters
  var isSpamTweet = spamtweet(tweet.text);
  var isRetweet = (tweet.retweeted_status !== undefined) ? true : false;
  var isQuoted = (tweet.quoted_status_id !== undefined) ? true : false;
  var isMention = (tweet.text.charAt(0) === '@') ? true : false;

  if(tweet.id_str !== lastTweetId && (isSpamTweet === false) && (isRetweet === false) && (isMention === false) && (isQuoted === false)){

    // update counter vars
    var tweetSentiment = sentiment(tweet.text);
    lastTweetId = tweet.id_str;
    totalTweets += 1;
    totalScore += tweetSentiment.score;
    adjustedScore = parseFloat((totalScore / totalTweets)).toFixed(2);

    // calculate time since data started coming through
    var timenow = Math.floor(Date.now() / 1000);
    var elapsedtime = (timenow - startTime); 
    var persecond = (totalTweets/elapsedtime).toFixed(2);
  
    // reset strong sentiment vars
    var positiveTweet = false;
    var negativeTweet = false;

    // record whether negative, positive or neutral
    if(tweetSentiment.score > 0){
      positive+=1;
      if(tweetSentiment.score > positiveThreshold){
        positiveTweet = true;
      }
    } else if(tweetSentiment.score < 0){
      negative+=1;
      if(tweetSentiment.score < negativeThreshold){
        negativeTweet = true;
      }
    } else {
      neutral+=1;
    }

    // if tweet is a strong sentient
    if(positiveTweet === true || negativeTweet === true){

      // get tweet URL for use in embed code
      var tweetstr = tweeturl.replace("{USER}",tweet.user.screen_name).replace("{TWEET_ID}",tweet.id_str); 
      
      // get tweet embed code
      request(embedurl+tweetstr, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var info = JSON.parse(body);
            var embed = info.html;

            if(positiveTweet === true){
              io.emit('positive-tweet',{
                  positiveTweet: embed,
                  tweetId: tweet.id_str
              });  
            } else {
              io.emit('negative-tweet',{
                  negativeTweet: embed,
                  tweetId: tweet.id_str
              });  
            }
        }
      });
    }

    // send geo-tweet event for tweets with coords
    if(tweet.coordinates !== null){ 
      io.emit('geo-tweet',{
        coordinates: tweet.coordinates.coordinates,
        text: tweet.text,
        positive: (tweetSentiment.score >0),
        negative: (tweetSentiment.score <0)
      });
    }

    // emit streamed results to frontend socket
    io.emit('scores',{
      tweet: tweet,
      sentiment: adjustedScore,
      totalTweets: totalTweets,
      positive: positive,
      neutral: neutral,
      negative: negative,
      persecond: persecond
    });

  } 

});