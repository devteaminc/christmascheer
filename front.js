var g = new JustGage({
    id: "gauge",
    value: 0,
    min: -10,
    max: +10,
    title: "Christmas Cheer",
    relativeGaugeSize: true
});

var sentimentStore = 0;

var socket = io();
socket.on('scores', function (data) {

        // only refresh graph if score has changed
        if(data.sentiment != sentimentStore){
            g.refresh(data.sentiment);
            sentimentStore = data.sentiment;
        }
        document.getElementById('tweetTotal').innerHTML = data.totalTweets;
    }

);

socket.on('positive-tweet', function (data) {
    document.getElementById('positive-tweet').style.display = 'none';
    document.getElementById('positive-tweet').innerHTML = data.positiveTweet;
    twttr.widgets.load(
      document.getElementById("positive-tweet")
    );
    document.getElementById('positive-tweet').style.display = '';
});


socket.on('negative-tweet', function (data) {
    document.getElementById('negative-tweet').style.display = 'none';
    document.getElementById('negative-tweet').innerHTML = data.negativeTweet;
    twttr.widgets.load(
      document.getElementById("negative-tweet")
    );
    document.getElementById('negative-tweet').style.display = '';
});