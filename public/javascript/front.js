var sentimentStore = 0;
var socket = io();
var map;

socket.on('scores', function (data) {
  $('#tweetTotal').html(data.totalTweets);
  $('#tweetPerSecond').html(data.persecond);
  $('#negativeTotal').html(data.negative);
  $('#neutralTotal').html(data.neutral);
  $('#positiveTotal').html(data.positive);
});

// positive tweet event
socket.on('positive-tweet', function (data) {
    addTweet('positive',data.tweetId,data.positiveTweet);
});

// negative tweet event
socket.on('negative-tweet', function (data) {
    addTweet('negative',data.tweetId,data.negativeTweet);
});

// negative tweet event
socket.on('geo-tweet', function (data) {
    geoTweet(data);
});


/**
 * Add a tweet to the page
 */
function addTweet(name,twId,twContent){

    // if loading spinner is visible - remove it
    if($('#'+name+'-tweet li img').is(':visible')){
        $('#'+name+'-tweet li').remove();
    }

    // id of new element
    var tweetId = 'tweet-'+ twId;

    // create new element
    var newTweet = '<li id="'+tweetId+'">'+twContent+'</li>';

    // prepend to list
    $(newTweet).hide().prependTo('#'+name+'-tweet').fadeIn();

    // only keep 10 list items    
    $('#'+name+'-tweet').children('li').slice(10).remove(); 

    // make sure twitter renders it
    twttr.widgets.load(
      document.getElementById(tweetId)
    );
}

/**
 * Respond to geo event
 */
function geoTweet(geo){

    var p = geo.coordinates;
    var lat = p[1];
    var lng = p[0];
    var latlng = new google.maps.LatLng(lat, lng);

    // show yellow icon for neutral, red for positive and purple for negative
    var icon = "//maps.google.com/mapfiles/ms/icons/yellow-dot.png";
    if(geo.positive === true || geo.negative === true){
        if(geo.positive === true){
            icon = "//maps.google.com/mapfiles/ms/icons/red-dot.png";
        } else {
            icon = "//maps.google.com/mapfiles/ms/icons/purple-dot.png";
        }
    }

    // add to map
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: geo.text,
        icon: icon
    });

    // set a new center of the map to latest marker and then pan to there
    var center = new google.maps.LatLng(lat, lng);
    mapDet.panTo(center);
    mapDet.setZoom(5);
}

/*
 * Initialise the map (callback from script embed)
 */
function initMap() {
    var mapOptions = {
        zoom: 2,
        draggable: false,
        scrollwheel: false,
        center: new google.maps.LatLng(0, 0),
        disableDefaultUI: true,
    };

   map = new google.maps.Map(document.getElementById('map'), mapOptions);
}