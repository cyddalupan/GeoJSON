var app = angular.module('app',[]);

app.controller('mainController', function($scope,$timeout,$http) {

	$scope.citymap = [];
	// var citymap = {
 //        Naga: {
 //            center: {lat: 13.696360, lng: 122.915039},
 //            intensity: 2714856,
 //            title: "tit_1",
 //            desc: "decs_1"
 //        },
 //        Manila: {
 //            center: {lat: 14.599512, lng: 120.984219},
 //            intensity: 405837,
 //            title: "tit_2",
 //            desc: "decs_2"
 //        },
 //        Apari: {
 //            center: {lat: 18.330736, lng: 121.267090},
 //            intensity: 3857799,
 //            title: "tit_3",
 //            desc: "decs_3"
 //        },
 //        Negros: {
 //            center: {lat: 9.673523, lng: 122.596436},
 //            mag: 603502,
 //            title: "tit_4",
 //            desc: "decs_4"
 //        }
 //    };

    $scope.initMap = function(events) {

    	//Clean array format
		angular.forEach(events.features, function(value, key) {
			console.log(value);
			$scope.ctmIn = [];
			$scope.ctmIn['center'] = {
				lat: value.geometry.coordinates[1],
				lng: value.geometry.coordinates[0]
			};
			$scope.ctmIn['mag'] = value.properties.mag;
			$scope.ctmIn['title'] = value.properties.title;
			$scope.ctmIn['desc'] = value.properties.title;

			$scope.citymap[value.id] = $scope.ctmIn;
		});

		console.log($scope.citymap);

        // Create the map.
        var map = new google.maps.Map(document.getElementById('map'), {
          zoom: 6,
          center: {lat: 12.500305, lng: 121.958687},
          mapTypeId: 'terrain'
        });

        // Construct the circle for each value in citymap.
        // Note: We scale the area of the circle based on the magnitude.
        for (var earthquake in $scope.citymap) {
            // Add the circle for this earthquake to the map.
            var cityCircle = new google.maps.Circle({
                strokeColor: 'red',
                strokeOpacity: 0.25,
                strokeWeight: 10,
                fillColor: 'black',
                fillOpacity: 0.4,
                map: map,
                center: $scope.citymap[earthquake].center,
                radius: Math.pow($scope.citymap[earthquake].mag,6)
            });
            var marker = new google.maps.Marker({
                position: $scope.citymap[earthquake].center,
                icon: "img/pin.png",
                map: map,
                title: $scope.citymap[earthquake].title
            });

            var infowindow = new google.maps.InfoWindow({
                maxWidth: 200
            });

            var content = $scope.citymap[earthquake].desc;

            google.maps.event.addListener(marker,'click', (function(marker,content,infowindow){ 
                return function() {
                    infowindow.setContent(content);
                    infowindow.open(map,marker);
                };
            })(marker,content,infowindow));  
        }
    }

    $scope.get_json = function(){
		$http({
			method: 'GET',
			url: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
			params : {
				'format':'geojson',
				'minlatitude': '4.553153',
				'minlongitude':'115.444336',
				'maxlatitude':'20.538935',
				'maxlongitude':'130.825195',
				'starttime':'1976-08-16',
				'endtime':'1976-08-18',
				'eventtype':'earthquake'
			}
		}).then(function successCallback(response) {
			//run map
			$scope.initMap(response.data);
		}, function errorCallback(response) {
			alert("Please check connection and try again.");
		});
    }

    function loadScript(url, callback)
	{
	    // Adding the script tag to the head as suggested before
	    var head = document.getElementsByTagName('head')[0];
	    var script = document.createElement('script');
	    script.type = 'text/javascript';
	    script.src = url;

	    // Then bind the event to the callback function.
	    // There are several events for cross browser compatibility.
	    script.onreadystatechange = callback;
	    script.onload = callback;

	    // Fire the loading
	    head.appendChild(script);
	}

	loadScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyD2-JYz_IISnez8rUvd3M322k-nSx6m7WA', function(){ $scope.get_json(); });
});