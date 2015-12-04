// load environment variables
require('dotenv').load();
var http = require('http'); 
var express = require('express');
var path = require('path');
var request = require('request');  
var favicon = require('serve-favicon');  
var sentiment = require('sentiment');
var mongoose = require('mongoose');
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

// connect to mongodb
mongoose.connect('mongodb://'+process.env.MONGO_CONNECTION);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  //console.log("open");
});

// setup mongoose schema
var Schema = mongoose.Schema;
var statSchema = new Schema({
    score: Number,
    datetime: Date,
    user: String,
    tweetid: Number
});

// init Stat model
var Stat = mongoose.model('Stat',statSchema);

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
    'win ',
    'contest ',
    'giveaway',
    'giftideas',
    'perfect gift',
    'harry styles',
    'harry_styles',
  ];
  
  var found = false;

  for (var j=0; j<subStrings.length; j++) {
    if (sourceString.toLowerCase().indexOf(subStrings[j]) !== -1) {
      found = true;
      break;
    }
  }
  return found;
}

function percentage(fraction,total){
    var x = (100 * fraction);
    var y = (x/total);
    var perc = Math.round(y);
    return perc;
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


// total positive scores
Stat.find({ score: { $gt: 0 }}, function (err, docs) {
  if (!err && docs !== null){ 
    positive = docs.length;
  }
});

// total negative scores
Stat.find({ score: { $lt: 0 }}, function (err, docs) {
  if (!err && docs !== null){ 
    negative = docs.length;
  }
});

// total neutral scores
Stat.find({ score: 0 }, function (err, docs) {
  if (!err && docs !== null){ 
    neutral = docs.length;
  }
});

// oldest record (for start date)
Stat.findOne({}, {}, { sort: { 'created_at' : 1 } }, function(err, stat) {
  if (!err && stat !== null){ 
    startTime = Math.floor(stat.datetime / 1000);
  }
});

// total tweets and total score
Stat.aggregate(
[
  {
    $group : {
       _id : null,
       sum: { $sum: "$score"},
       count: { $sum: 1 }
    }
  }
], function (err, results) {
    if (err) {
        console.error(err);
    } else {
        if(results.length > 0){
          totalScore = results[0].sum;
          totalTweets = results[0].count;
        }
    }
}); 

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
  var isQuoted = (tweet.quoted_status_id !== undefined) ? true : false;
  var isMention = (tweet.text.charAt(0) === '@') ? true : false;

  if(tweet.id_str !== lastTweetId && (isSpamTweet === false) && (isRetweet === false) && (isMention === false) && (isQuoted === false)){

    var tweetSentiment = sentiment(tweet.text);

    // store results in mongo
    var stored = new Stat({
      score: tweetSentiment.score,
      datetime: Date.now(),
      user: tweet.user.screen_name,
      tweetid: tweet.id_str
    }).save();

    lastTweetId = tweet.id_str;
    totalTweets += 1;
    totalScore += tweetSentiment.score;
    adjustedScore = parseFloat((totalScore / totalTweets)).toFixed(2);

    // calculate time since data started coming through
    var timenow = Math.floor(Date.now() / 1000);
    var elapsedtime = (timenow - startTime); 
    var persecond = (totalTweets/elapsedtime).toFixed(2);
    
    var positiveTweet = false;
    var negativeTweet = false;

    if(tweetSentiment.score > 0){
      positive+=1;

      if(tweetSentiment.score > 6){
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


      request('https://api.twitter.com/1/statuses/oembed.json?conversation=none&omit_script=true&url='+tweetstr, function (error, response, body) {
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