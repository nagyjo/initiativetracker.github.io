(function() {
	window.onbeforeunload = function(){
		return 'Are you sure you want to leave?';
	};

	var app = angular.module('initiativeTracker', ['mm.foundation', 'angular.filter']);

	app.controller('initiativeCtrl', function($scope, $modal, $location, $anchorScroll) {
		// Private collection
		var collection = new CharacterCollection();
		// List of characters
		$scope.getCharacters = function() {
			return collection.characters;
		};

		// Read every character input
		$scope.inputAll = function() {
			readInitiation(collection.characters);
		};

		// Generate random to NPC, read others
		$scope.randomNPC = function() {
			collection.randomNPC();
			collection.order();

			readInitiation(_.filter(collection.characters, {'npc': false}));
		};

		// Generate random to all character
		$scope.randomAll = function () {
			collection.randomAll();
			collection.order();
		};

		$scope.enableNext = false;
		$scope.rollType = 2;
		$scope.rollVariations = {
			1: {
				'name': 'Read All',
				'hint': 'Read every character initiation by input.',
				'func': $scope.inputAll
			},

			2: {
				'name': 'Read Players',
				'hint': 'Read player characters initiation, by input, random to NPCs.',
				'func': $scope.randomNPC
			},

			3: {
				'name': 'Random All',
				'hint': 'Generate random to every character.',
				'func': $scope.randomAll
			}
		};

		// Call the proper function from rollVariations dictionary
		$scope.roll = function(rollType) {
			$scope.rollVariations[rollType]['func']();
			$scope.enableNext = true;
		};

		$scope.next = function() {
			var nextCharacter = collection.next();
			var nextNodeId = 'character-' + nextCharacter.id;
			$location.hash(nextNodeId);
			$anchorScroll();
			startTimer();
			resetTime();
		};

		// Counter functions
		var startTimer = function() {
			$scope.counting = true;
		};

		var resetTime = function() {
			$scope.timePassed = 0;
		};

		var updateTimer = function() {
			if (!$scope.counting)
				return;

			$scope.timePassed++;

			var formatSeconds = function(seconds) {
				return (seconds < 10) ?  '0' + seconds : seconds;
			};

			var elsapedTime = $scope.timePassed;
			var elapsedTimeString = '';

			if ($scope.timePassed < 60) {
				elapsedTimeString = '0:' + formatSeconds(elsapedTime);
			}
			else {
				var minutes = Math.floor(elsapedTime / 60);
				var seconds = elsapedTime % 60;

				elapsedTimeString = minutes + ':' + formatSeconds(seconds);
			}

			setTime(elapsedTimeString);
		};

		var setTime = function(timeString) {
			document.getElementById('counter').innerHTML = timeString;
		};

		var initTimer = function() {
			$scope.counting = false;
			resetTime();
			setInterval(updateTimer, 1000);
		};

		initTimer();
		// Counter functions end

		$scope.remove = function(id) {
			var character = _.find(collection.characters, {'id': id});
			if (character.active)
				$scope.next();


			var text = 'Would you like to delete this character: (#' + character.id + ') ' + character.name + '?';
			if (confirm(text))
				collection.remove(id);
		};

		$scope.modifyHealth = function(characterId) {
			var character = _.find(collection.characters, {'id': characterId});

			var modalInstance = $modal.open({
				templateUrl: 'healthModification.html',
				controller: 'healthModificationCtrl',
				resolve: {
					character: function() {
						return character;
					}
				}
			});
		};

		var readInitiation = function(characters) {
			if (!characters.length)
				return;

			read(characters, 0);

			function read(characters, index) {
				var modalInstance = $modal.open({
					templateUrl: 'readInitiation.html',
					controller: 'readInitiationCtrl',
					resolve : {
						character: function() {
							return characters[index];
						}
					}
				});

				modalInstance.result.then(function(initiationValue) {
					if (characters.length > ++index)
						read(characters, index);
					else
						collection.order();
				});
			}
		};

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
		};

		$scope.showAreaDamageForm = function() {
			var modalInstance = $modal.open({
				templateUrl: 'setupAreaDamageForm.html',
				controller: 'areaHealthModificationCtrl',
				resolve: {
					characters: function() {
						return $scope.getCharacters();
					}
				}
			});

			modalInstance.result.then(function() {

			});
		};

		$scope.showCharacterForm = function() {

			var modalInstance = $modal.open({
				templateUrl: 'addCharacterForm.html',
				controller: 'addCharacterCtrl'
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

		$scope.focusElement = function() {
		};

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
		$scope.character = undefined;
		$scope.message = '';
		$scope.defaults = {
          'name': 'Unknown',
          'base_initiation': 0,
          'rolled_initiation': 0,
          'initiation': 0,        // base_initiation + rolled_initiation
          'initiation_order' : 0, // The order start by 1.
          'active': false,
          'health': 0,
          'defense': 0,
          'npc': true
        };

		$scope.add = function() {
			if ($scope.character.name == ''){
				$scope.message = 'Character name required!';
				return;
			}

			$scope.characters.push(angular.copy($scope.character));
			$scope.message = 'Character added: ' + $scope.character.name + ' (' + $scope.characters.length + ' characters)';
		};

		$scope.done = function() {
			$scope.close();
		};

		$scope.close = function() {
			$modalInstance.close($scope.characters);
		};

		var init = function() {
			if (_.isUndefined($scope.character))
				$scope.character = angular.copy($scope.defaults);
		};

		init();
	});

	app.controller('healthModificationCtrl', function($scope, $modalInstance, character){
		$scope.character = character;

		$scope.change = 0;

		$scope.done = function(change) {
			$scope.character.health -= change;
			$modalInstance.close($scope.character);
		}
	});

	app.controller('areaHealthModificationCtrl', function($scope, $modalInstance, characters){
		$scope.areaDamage = 0;
		$scope.cloneCharacters = [];

		characters.forEach(function (character, index) {
			$scope.cloneCharacters[index] = angular.copy(character);
			$scope.cloneCharacters[index].damaged = "no";
		});

		$scope.done = function(areaDamage) {
			$scope.cloneCharacters.forEach(function (cloneCharacter) {
				var character = _.find(characters, {'id': cloneCharacter.id});

				switch (cloneCharacter.damaged) {
					case "half":
						character.health -= Math.floor(areaDamage /2);
						break;
					case "full":
						character.health -= areaDamage;
				}
			});

			$modalInstance.close();
		};

		$scope.cancel = function() {
			$modalInstance.close();
		};

		$scope.getAreaDamageContentLabel = function (key) {
			if(key === "true") {
				return "Non Player Characters";
			} else {
				return "Player Characters"
			}
		};
	})
})();