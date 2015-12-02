var sentimentStore = 0;

var socket = io();
socket.on('scores', function (data) {
        $('#tweetTotal').html(data.totalTweets);
        $('#tweetPerSecond').html(data.persecond);
        $('#negativeTotal').html(data.negative);
        $('#neutralTotal').html(data.neutral);
        $('#positiveTotal').html(data.positive);
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

    // only keep 10 list items    
    $('#' + listName).children('li').slice(10).remove(); 
}

function percentage(fraction,total){
    var x = (100 * fraction);
    var y = (x/total);
    var perc = Math.round(y);
    return perc;
}