// Get context with jQuery - using jQuery's .get() method.
var ctx = $("#myChart").get(0).getContext("2d");


var data = {
    labels: ["Negative", "Neutral", "Positive"],
    datasets: [
        {
            data: [0, 0, 0]
        },
    ]
};

// This will get the first returned node in the jQuery collection.
var myBarChart = new Chart(ctx).Bar(data);
myBarChart.datasets[0].bars[0].fillColor = "red"; //bar 1
myBarChart.datasets[0].bars[1].fillColor = "orange"; //bar 2
myBarChart.datasets[0].bars[2].fillColor = "green"; //bar 3

var sentimentStore = 0;

var socket = io();
socket.on('scores', function (data) {

        // only refresh graph if score has changed
        if(data.sentiment != sentimentStore){
            
            myBarChart.datasets[0].bars[0].value = data.negative;
            myBarChart.datasets[0].bars[1].value = data.neutral;
            myBarChart.datasets[0].bars[2].value = data.positive;
            
            // Would update the first dataset's value of 'March' to be 50
            myBarChart.update();
            sentimentStore = data.sentiment;
        }
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
}

function percentage(fraction,total){
    var x = (100 * fraction);
    var y = (x/total);
    var perc = Math.round(y);
    return perc;
}