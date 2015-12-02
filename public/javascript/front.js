var g = new JustGage({
    id: "gauge",
    value: 0,
    min: 0,
    max: +3,
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

    if($('#positive-tweet li img').is(':visible')){
        $('#positive-tweet li').remove();
    }
    var tweetId = 'tweet-'+ data.tweetId;
    var newTweet = '<li id="'+tweetId+'">'+data.positiveTweet+'</li>';
    prependListItem('positive-tweet',newTweet);
    $('#'+tweetId).next().css('opacity',0.75);
    twttr.widgets.load(
      document.getElementById(tweetId)
    );
});


socket.on('negative-tweet', function (data) {

    if($('#negative-tweet li img').is(':visible')){
        $('#negative-tweet li').remove();
    }
    var tweetId = 'tweet-'+ data.tweetId;
    var newTweet = '<li id="'+tweetId+'">'+data.negativeTweet+'</li>';
    prependListItem('negative-tweet',newTweet);
    $('#'+tweetId).next().css('opacity',0.75);
    twttr.widgets.load(
      document.getElementById(tweetId)
    );
});

function prependListItem(listName, listItemHTML){
    $(listItemHTML)
        .hide()
        .css('opacity',0.0)
        .prependTo('#' + listName)
        .slideDown('slow')
        .animate({opacity: 1.0});
}