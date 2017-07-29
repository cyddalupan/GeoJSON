var app = angular.module('app',[]);

app.controller('mainController', function($scope,$timeout,$http,$filter) {

	$scope.citymap = [];
	$scope.preloader_stop = 0;
	$scope.error_message = '';
	$scope.start_date = '';
	$scope.end_date = '';

	$scope.mapblur = function(filterVal){
		$('#map')
		  .css('filter','blur('+filterVal+'px)')
		  .css('webkitFilter','blur('+filterVal+'px)')
		  .css('mozFilter','blur('+filterVal+'px)')
		  .css('oFilter','blur('+filterVal+'px)')
		  .css('msFilter','blur('+filterVal+'px)');
		if(filterVal == 0){
			$('.overlay-dark').fadeOut('slow');
			$('.ui-user').fadeOut('slow');
		}else{
			$('.overlay-dark').fadeIn('slow');
			$('.ui-user').fadeIn('slow');
		}
	}
	//blur on load
	$scope.mapblur(15);

    $scope.initMap = function(events) {

    	//Clean array format
		angular.forEach(events.features, function(value, key) {
			$scope.ctmIn = [];
			$scope.ctmIn['center'] = {
				lat: value.geometry.coordinates[1],
				lng: value.geometry.coordinates[0]
			};
			$scope.ctmIn['mag'] = value.properties.mag;
			$scope.ctmIn['title'] = value.properties.title;

			//layout
			$scope.ctmIn['desc'] = "<sup>"+$filter('date')(value.properties.time, 'longDate')+"</sup>";
			$scope.ctmIn['desc'] += "<h5>"+value.properties.title+"</h5>";
			$scope.ctmIn['desc'] += "<strong>Depth</strong>: "+value.geometry.coordinates[2]+"<br>";
			$scope.ctmIn['desc'] += "<strong>Magnitude</strong>: "+value.properties.mag+"<br>";
			$scope.ctmIn['desc'] += "<strong>Location</strong>: "+value.properties.place+"<br>";

			$scope.citymap[value.id] = $scope.ctmIn;
		});

        // Show the map and pearl in middle.
        map = new google.maps.Map(document.getElementById('map'), {
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
                strokeWeight: ($scope.citymap[earthquake].mag*3),
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
                maxWidth: 300
            });

            var content = $scope.citymap[earthquake].desc;

            google.maps.event.addListener(marker,'click', (function(marker,content,infowindow){ 
                return function() {
                    infowindow.setContent(content);
                    infowindow.open(map,marker);
                };
            })(marker,content,infowindow));  
        }

        //
		$scope.mapblur(0);
    }

    $scope.get_json = function(){

		$http({
			method: 'GET',
			url: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
			params : {
				'format':'geojson',
				//Philippine area *start
				'minlatitude': '4.553153',
				'minlongitude':'115.444336',
				'maxlatitude':'20.538935',
				'maxlongitude':'130.825195',
				//Philippine area *end
				'eventtype':'earthquake',
				//user inputs
				'starttime':$filter('date')($scope.start_date, 'yyyy-MM-dd'),
				'endtime':$filter('date')($scope.end_date, 'yyyy-MM-dd')
			}
		}).then(function successCallback(response) {
			//run map
			$scope.initMap(response.data);
		}, function errorCallback(response) {
			alert("Please check connection and try again.");
		});
    }

    $scope.showErrorMsg = function(error_message){
    	$scope.error_message = error_message;
    	$('.error-container').show(1,function(){
	    	$('.error-message').slideDown('fast',function(){
	    		$timeout(function(){
	    			$('.error-message').slideUp('fast',function(){
	    				$('.error-container').hide(1);
	    			});
	    		},3000);
	    	});
    	});
    }

    $scope.submitDate = function(){
    	startDate = $('.start-date-picker').datepicker('getDate');
    	endDate = $('.end-date-picker').datepicker('getDate');

    	if(startDate == null || endDate  == null){
    		$scope.showErrorMsg('Please select a date');
    	}else{
	    	if(endDate > startDate){
				$scope.start_date = startDate;
				$scope.end_date = endDate;
				//
				$scope.get_json();
	    	}else{
    			$scope.showErrorMsg("The end date must be greater than start date");
	    	}
    	}
    }

    $scope.get_blank_map = function(){
    	map = new google.maps.Map(document.getElementById('map'), {
			zoom: 6,
			center: {lat: 12.500305, lng: 121.958687},
			mapTypeId: 'terrain'
        });
    }

    $scope.done_loading = function(){
    	$('.geo_logo').animate({'margin-top':'3%'},1000,function(){
			$('.date-picker-form').fadeIn("slow");
		});
    }

	$scope.pre_loader = function(){
		$('.geo_logo_mask').hide(1,function(){
			$('.geo_logo_mask').animate({width:'toggle'},1000,function(){
				if($scope.preloader_stop == 0)
					$scope.pre_loader();
				else
					$scope.done_loading();
			});
		});
	}
	$scope.pre_loader();

	$(window).on("load", function() {
		$timeout(function(){
			$scope.preloader_stop = 1;
		},500);
	});

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

	$('.start-date-picker').datepicker({});
	$('.end-date-picker').datepicker({});

	loadScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyD2-JYz_IISnez8rUvd3M322k-nSx6m7WA', function(){ $scope.get_blank_map(); });
});