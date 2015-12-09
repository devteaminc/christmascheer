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
    var newTweet = '<li id="'+tweetId+'" style="display:none;">'+twContent+'</li>';

    // prepend to list
    $(newTweet).prependTo('#'+name+'-tweet');

    // make sure twitter renders it
    twttr.widgets.load(
      document.getElementById(tweetId)
    );

    //$('#'+tweetId).fadeIn();
    $('#'+tweetId).delay( 800 ).fadeIn( 400 );

    // only keep 10 list items    
    $('#'+name+'-tweet').children('li').slice(10).remove(); 
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
    map.panTo(center);
    map.setZoom(5);
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
        styles: 
        [
    {
        "featureType": "administrative",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#444444"
            }
        ]
    },
    {
        "featureType": "administrative.country",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "administrative.country",
        "elementType": "labels.text",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "administrative.province",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative.province",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative.province",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative.province",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "administrative.neighborhood",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative.land_parcel",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "all",
        "stylers": [
            {
                "color": "#f2f2f2"
            },
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#363636"
            }
        ]
    },
    {
        "featureType": "landscape.man_made",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "landscape.natural.terrain",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi.government",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi.government",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi.government",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "all",
        "stylers": [
            {
                "saturation": -100
            },
            {
                "lightness": 45
            },
            {
                "visibility": "simplified"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.text",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "simplified"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit.station.rail",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "all",
        "stylers": [
            {
                "color": "#46bcec"
            },
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#9dcdd4"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    }
]
    };

   map = new google.maps.Map(document.getElementById('map'), mapOptions);
}