// google map
var map = '';
var center;

function initialize() {
    var mapOptions = {
      zoom: 17,
      center: new google.maps.LatLng(23.113240, 72.600314),
      scrollwheel: false
    };
  
    map = new google.maps.Map(document.getElementById('map-canvas'),  mapOptions);

    var marker = new google.maps.Marker({
      position: {lat: 23.113240, lng:  72.600314},
      map: map
    });

    google.maps.event.addDomListener(map, 'idle', function() {
        calculateCenter();
    });
    
    google.maps.event.addDomListener(window, 'resize', function() {
        map.setCenter(center);
    });
}

function calculateCenter() {
  center = map.getCenter();
}

function loadGoogleMap(){
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDXA_PTUaopZfXDFDXwQgFm_ys20dNad3s&' + 'callback=initialize';
    document.body.appendChild(script);
}
$(function(){
  loadGoogleMap();
});
