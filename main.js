var app = angular.module('app',[]);
// App controller
app.controller('mainController', function($scope,$timeout,$http,$filter) {
	// Initial variable declaration
	$scope.citymap = [];
	$scope.preloader_stop = 0;
	$scope.error_message = '';
	$scope.start_date = '';
	$scope.end_date = '';
	$scope.submit_txt = 'Submit';
	/**
	 * Hide or show form/map
	 *
	 * Hide the calendar and user UI
	 * Remove map blur and dark overlay
	 * show the back button
	 *
	 * reverse effect if @param filterVal has value
	 */
	$scope.mapblur = function(filterVal){
		$('#map')
		  .css('filter','blur('+filterVal+'px)')
		  .css('webkitFilter','blur('+filterVal+'px)')
		  .css('mozFilter','blur('+filterVal+'px)')
		  .css('oFilter','blur('+filterVal+'px)')
		  .css('msFilter','blur('+filterVal+'px)');
		if(filterVal == 0){
			$('#overlay-dark').fadeOut('slow');
			$('#ui-user').fadeOut('slow');
			$('#back-to-form').fadeIn('fast');
		}else{
			$scope.submit_txt = 'Submit';
			$('#overlay-dark').fadeIn('slow');
			$('#ui-user').fadeIn('slow');
			$('#back-to-form').fadeOut('fast');
		}
	}
	// Load mapblur on load
	$scope.mapblur(15);
	// To update pin in the map
    $scope.initMap = function(events) {
    	// clear citymap data for new date request
    	$scope.citymap = [];
    	// Clean array format
		angular.forEach(events.features, function(value, key) {
			/**
			 * ctMin means citymapInside
			 * use to generate a clean array
			 * before passing to citymap array
			 */
			$scope.ctmIn = [];
			$scope.ctmIn['center'] = {
				lat: value.geometry.coordinates[1],
				lng: value.geometry.coordinates[0]
			};
			$scope.ctmIn['mag'] = value.properties.mag;
			$scope.ctmIn['title'] = value.properties.title;
			// designing the event info
			$scope.ctmIn['desc'] = "<sup>"+$filter('date')(value.properties.time, 'longDate')+"</sup>";
			$scope.ctmIn['desc'] += "<h5>"+value.properties.title+"</h5>";
			$scope.ctmIn['desc'] += "<strong>Depth</strong>: "+value.geometry.coordinates[2]+"<br>";
			$scope.ctmIn['desc'] += "<strong>Magnitude</strong>: "+value.properties.mag+"<br>";
			$scope.ctmIn['desc'] += "<strong>Location</strong>: "+value.properties.place+"<br>";
			// pass clean array citymap
			$scope.citymap[value.id] = $scope.ctmIn;
		});
        // Default is estimated philippine area
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
            // confir marker
            var marker = new google.maps.Marker({
                position: $scope.citymap[earthquake].center,
                icon: "img/pin.png",
                map: map,
                title: $scope.citymap[earthquake].title
            });
            // confir gmap infoWindow
            var infowindow = new google.maps.InfoWindow({
                maxWidth: 300
            });
            // pass to variable for event click reuse
            var content = $scope.citymap[earthquake].desc;
            // make marker clickable and show event info
            google.maps.event.addListener(marker,'click', (function(marker,content,infowindow){ 
                return function() {
                    infowindow.setContent(content);
                    infowindow.open(map,marker);
                };
            })(marker,content,infowindow));  
        }
        /**
         * Hide and blurr map on background
         * show the date picker
         */
		$scope.mapblur(0);
    }
    // Run earthquake query api after user select start and end date
    $scope.get_json = function(){
		$http({
			method: 'GET',
			url: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
			params : {
				'format':'geojson',
				// Philippine area *start
				'minlatitude': '4.553153',
				'minlongitude':'115.444336',
				'maxlatitude':'20.538935',
				'maxlongitude':'130.825195',
				// Philippine area *end
				'eventtype':'earthquake',
				// User inputs
				'starttime':$filter('date')($scope.start_date, 'yyyy-MM-dd')+"T00:00:00+08:00",
				'endtime':$filter('date')($scope.end_date, 'yyyy-MM-dd')+"T23:59:59+08:00"
			}
		}).then(function successCallback(response) {
			// Update the map, now with marker from api
			$scope.initMap(response.data);
		}, function errorCallback(response) {
			alert("Please check connection and try again.");
		});
    }
    /**
     * function to show error message 
     * And hide after specified time
     */
    $scope.showErrorMsg = function(error_message){
    	$scope.error_message = error_message;
    	$('#error-container').show(1,function(){
	    	$('.error-message').slideDown('fast',function(){
	    		$timeout(function(){
	    			$('.error-message').slideUp('fast',function(){
	    				$('#error-container').hide(1);
	    			});
	    		},3000);
	    	});
    	});
    	//delay to sync with error message
    	$timeout(function(){
    		$scope.submit_txt = 'Submit';
    	},3000);
    }
    // after user select start and end date
    $scope.submitDate = function(){
    	/**
    	 * Change Submit button message to loading
    	 * changing this to loading also disables the button
		 */
    	$scope.submit_txt = 'loading';
    	// pass user selected date to shorter variable
    	startDate = $('.start-date-picker').datepicker('getDate');
    	endDate = $('.end-date-picker').datepicker('getDate');
    	// validate user input
    	$scope.error_message = "No Error";
    	// validation rules
    	if(startDate == null || endDate  == null)
    		$scope.error_message = "Please select a date";
    	else if(endDate > new Date())
    		$scope.error_message = "You can't select a future date";
		else if(startDate > endDate)
    		$scope.error_message = "The end date must be greater than start date";
    	// handle validation result
    	if($scope.error_message == "No Error"){
			$scope.start_date = startDate;
			$scope.end_date = endDate;
			// Run Api code when no error
			$scope.get_json();
    	}else{
    		$scope.showErrorMsg($scope.error_message);
    	}
    }
    /**
     * get map without marker to show as background of form
     * this load after loading google map api
     */
    $scope.get_blank_map = function(){
    	map = new google.maps.Map(document.getElementById('map'), {
			zoom: 6,
			center: {lat: 12.500305, lng: 121.958687},
			mapTypeId: 'terrain'
        });
    }
    // trigger to stop preloader animation
    $scope.done_loading = function(){
    	$('.geo_logo').animate({'margin-top':'3%'},1000,function(){
			$('#date-picker-form').fadeIn("slow");
		});
    }
    // pre loader function calls itself until loading is finished
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
	// run pre loader animation on load
	$scope.pre_loader();
	// wait for page load before stop loading animation
	$(window).on("load", function() {
		$timeout(function(){
			$scope.preloader_stop = 1;
		},500);
	});
	// use to load google map api inside this angular controller
    function loadScript(url, callback){
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
	// this generates the calendar
	$('.start-date-picker').datepicker({});
	$('.end-date-picker').datepicker({});
	/**
	 * Use angular to load google map
	 * To make sure the map is loaded
	 * Before loading map script
	 */
	loadScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyD2-JYz_IISnez8rUvd3M322k-nSx6m7WA', function(){ $scope.get_blank_map(); });
});