// load environment variables
require('dotenv').load();
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

// twitter credentials - loaded from .env file when local
var tw = new twitter({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  token: process.env.access_token,
  token_secret: process.env.access_token_secret
});

function spamTweet(sourceString) {
  
  var subStrings = [
    'competition',
    'rt & follow',
    'rt &amp; follow',
    'rt & follow',
    'rt + follow',
    'retweet & follow',
    'retweet',
    'win',
    'contest',
    'giveaway',
    'giftideas',
    'perfect gift'
  ];
  
  var found = false;

  subStrings.forEach(function(subString) {
    if (sourceString.toLowerCase().indexOf(subString) !== -1) {
      found = true;
    }
  });
  
  return found;
}

function getTweetUrl(user,tweet){
  var tweetstr = "http://twitter.com/{USER}/status/{TWEET_ID}";
  return tweetstr.replace("{USER}",user).replace("{TWEET_ID}",tweet); 
}


var lastTweetId = null;
var totalTweets = 0;
var totalScore = 0;
var adjustedScore = 0;
var positive = 0;
var neutral = 0;
var negative = 0;
var startTime = Math.floor(Date.now() / 1000);

// track christmas
tw.track('christmas');

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

  var isSpamTweet = spamTweet(tweet.text);
  var isRetweet = (tweet.retweeted_status !== undefined) ? true : false;
  var isMention = (tweet.text.charAt(0) === '@') ? true : false;

  if(tweet.id_str !== lastTweetId && (isSpamTweet === false) && (isRetweet === false) && (isMention === false)){

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

      if(tweetSentiment.score < -4){
        negativeTweet = true;
      }

    } else {
      neutral+=1;
    }

    if(positiveTweet === true || negativeTweet === true){

      var tweetstr = getTweetUrl(tweet.user.screen_name,tweet.id_str);


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