function openNav() {
    document.getElementById("myNav").style.height = "100%";
}

function closeNav() {
    document.getElementById("myNav").style.height = "0%";
}


// Sin Wave 
var waves = new SineWaves({
  el: document.getElementById('waves'),
  
  speed: 4,
  
  width: function() {
    return $(window).width();
  },
  
  height: function() {
    return 250;
  },
  
  ease: 'SineInOut',
  
  wavesWidth: '90%',
  
  waves: [
    {
      timeModifier: 4,
      lineWidth: 1,
      amplitude: -25,
      wavelength: 25
    },
    {
      timeModifier: 2,
      lineWidth: 2,
      amplitude: -50,
      wavelength: 50
    },
    {
      timeModifier: 1,
      lineWidth: 1,
      amplitude: -100,
      wavelength: 100
    },
    {
      timeModifier: 0.5,
      lineWidth: 3,
      amplitude: -80,
      wavelength: 80
    },
    {
      timeModifier: 0.7,
      lineWidth: 2,
      amplitude: -120,
      wavelength: 130
    }
  ],  
 
  // Called on window resize
  resizeEvent: function() {
    var gradient = this.ctx.createLinearGradient(0, 0, this.width, 0);
    gradient.addColorStop(0,"rgba(17,88,131, 0.8)");
    gradient.addColorStop(0.5,"rgba(20,123,184, 0.5)");
    gradient.addColorStop(1,"rgba(17,88,131, 0.8)");
    
    var index = -1;
    var length = this.waves.length;
    while(++index < length){
      this.waves[index].strokeStyle = gradient;
    }
    
    // Clean Up
    index = void 0;
    length = void 0;
    gradient = void 0;
  }
});


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
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBYVdRh1p5eUTPDkF6sUBQBbqzsVLp0MHY&' + 'callback=initialize';
    document.body.appendChild(script);
}
$(function(){
  loadGoogleMap();
});


$(document).ready(function() {
  $('#moveSectionUp').click(function(e){
    e.preventDefault();
    fullpage.moveSectionUp();
  });

  $('#moveSectionDown').click(function(e){
    e.preventDefault();
    fullpage.moveSectionDown();
  });

  fullpage.initialize('#fullpage', {
	  anchors: ['home', 'expertSolution', 'raisonDetre', '4thpage', 'lastPage'],
	      menu: '#menu',
	      navigation:true,
	      continuousVertical:true,
	      css3:true
	      });
  
});