;
(function() {
	var app = angular.module('initiativeTracker', ['mm.foundation']);

	app.controller('initiativeCtrl', function($scope, $modal) {
		// Private collection
		var collection = new CharacterCollection();
		// List of characters
		$scope.getCharacters = function() {
			return collection.characters;
		}

		// Read every character input
		$scope.inputAll = function() {
			_.each(collection.characters, function(obj){
				readInitiation(obj);
			});
		}

		// Generate random to NPC, read others
		$scope.randomNPC = function() {
			collection.randomNPC();
			collection.order();

			_.each(_.filter(collection.characters, {'npc': false}), function(obj) {
				readInitiation(obj);
			});
		}

		// Generate random to all character
		$scope.randomAll = function () {
			collection.randomAll();
			collection.order();
		}

		$scope.enableNext = false;
		$scope.rollType = 2;
		$scope.rollVariations = {
			1: {
				'name': 'Read all input',
				'func': $scope.inputAll,
			},

			2: {
				'name': 'Random to NPC',
				'func': $scope.randomNPC,
			},

			3: {
				'name': 'Random to All',
				'func': $scope.randomAll,
			},
		};

		// Call the proper function from rollVariations dictionary
		$scope.roll = function(rollType) {
			$scope.rollVariations[rollType]['func']();
			$scope.enableNext = true;
		}

		$scope.next = function() {
			console.log('next');
			collection.next();
			startTimer();
		}

		var resetTimer = function() {
			setTime('0:00');
		}

		var updateTimer = function() {
			var currentTime = new Date().getTime();
			var elapsedTime = Math.round((currentTime - $scope.startTime) / 1000);

			var elapsedTimeString = '';

			var formatSeconds = function(seconds) {
				return (seconds < 10) ?  '0' + seconds : seconds;
			}

			if (elapsedTime < 60) {
				elapsedTimeString = '0:' + formatSeconds(elapsedTime);
			}
			else {
				var minutes = Math.floor(elapsedTime / 60);
				var seconds = elapsedTime % 60;

				elapsedTimeString = minutes + ':' + formatSeconds(seconds);
			}

			setTime(elapsedTimeString);
		}

		var setTime = function(timeString) {
			document.getElementById('counter').innerHTML = timeString;
		}

		var startTimer = function() {
			if (!_.isUndefined($scope.timer))
				clearInterval($scope.timer);

			resetTimer();
			$scope.startTime = new Date().getTime();
			$scope.timer = setInterval(updateTimer, 1000);
		}

		$scope.remove = function(id) {
			if (_.find(collection.characters, {'id': id}).active)
				$scope.next();
			collection.remove(id);
		}

		// Modal windows
		var readInitiation = function(character) {
			var modalInstance = $modal.open({
				templateUrl: 'readInitiation.html',
				controller: 'readInitiationCtrl',
				resolve : {
					character: function() {
						return character;
					},
				}
			});

			modalInstance.result.then(function(initiationValue) {
				collection.order();
			});
		}

		$scope.changeRollType = function() {

			var modalInstance = $modal.open({
				templateUrl: 'pickRollType.html',
				controller: 'pickRollTypeCtrl',
				resolve: {
					variations: function() {
						return $scope.rollVariations;
					}
				}
			});

			modalInstance.result.then(function(rollType) {
				$scope.rollType = rollType;
			});
		}

		$scope.showCharacterForm = function() {

			var modalInstance = $modal.open({
				templateUrl: 'addCharacterForm.html',
				controller: 'addCharacterCtrl',
			});

			modalInstance.result.then(function(newCharacters) {
				_.each(newCharacters, function(character) {
					collection.add(character);
				});
			});
		}
	});

	// Read initiation controller
	app.controller('readInitiationCtrl', function($scope, $modalInstance, character){
		$scope.character = character;

		$scope.done = function() {
			$modalInstance.close($scope.character);
		}
	});

	// RollType pick controller
	app.controller('pickRollTypeCtrl', function($scope, $modalInstance, variations){
		$scope.variations = variations;

		$scope.pick = function(typeNumber) {
			$modalInstance.close(typeNumber);
		}
	});

	// Character form controller
	app.controller('addCharacterCtrl', function($scope, $modalInstance){

		$scope.characters = [];
		$scope.character = {};
		$scope.message = '';
		$scope.defaults = {
          'name': '',
          'base_initiation': 0,
          'rolled_initiation': 0,
          'initiation': 0,        // base_initiation + rolled_initiation
          'initiation_order' : 0, // The order start by 1.
          'active': false,
          'health': 0,
          'defense': 0,
          'npc': true,
        };

		$scope.add = function() {
			if ($scope.character.name == ''){
				$scope.message = 'Character name required!';
				$scope.reset();
				return;
			}

			$scope.characters.push(angular.copy($scope.character));
			$scope.message = 'Character added: ' + $scope.character.name;
			$scope.reset();
		}

		$scope.done = function() {
			$scope.add();
			$scope.close();
		}

		$scope.close = function() {
			$modalInstance.close($scope.characters);
		}

		$scope.reset = function() {
			_.each($scope.defaults, function(value, key) { $scope.character[key] = value; });
		}

		$scope.error = function() {
			$scope.reset();
		}

		// Controller initialization
		var init = function() {
			$scope.reset();
		}

		init();
	});

})();