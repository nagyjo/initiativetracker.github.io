;
(function() {
	var id = 0;

	var Character = function(obj) {
		this.id = ++id;
		this.base_initiation = obj['base_initiation'] || 0;
		this.rolled_initiation = 0;
		this.initiation = this.base_initiation + this.rolled_initiation;
		this.initiation_order = 0;
		this.active = false;
		this.health = obj['health'] || 0;
		this.defense = obj['defense'] || 0;
		this.npc = obj['npc'];
		this.name = obj['name'] || '';
		this.uniqueName = true;
	}

	Character.prototype.set = function(key, value) {
		this[key] = value;
	}

	Character.prototype.random = function() {
		var min = 1;
		var max = 20;
		this.rolled_initiation = Math.floor((Math.random() * max) + min);
	}

	Character.prototype.calculateInitiation = function() {
		this.initiation = this.base_initiation + this.rolled_initiation;
	}

	Character.prototype.resetOrder = function() {
		this.initiation_order = 0;
		this.active = false;
	}

	Character.prototype.startTurn = function() {
		this.active = true;
	}

	Character.prototype.endTurn = function() {
		this.active = false;
	}

	CharacterCollection = function() {
		this.characters = [];
	}

	CharacterCollection.prototype.add = function(obj) {
		this.characters.push(new Character(obj));
		this.uniqueName();
	}

	CharacterCollection.prototype.remove = function(id) {
		_.remove(this.characters, function(obj) {
			return obj.id == id;
		});

		this.order();
	}

	CharacterCollection.prototype.next = function() {
		var current = _.find(this.characters, {'active': true});
		var next;

		if (_.isUndefined(current)) {
			next = _.find(this.characters, {'initiation_order': 1});
		}
		else {
			var order = current['initiation_order'];
			var followings = _.filter(this.characters, function(obj) { return obj['initiation_order'] > order });
			next = _.minBy(followings, 'initiation_order');
		}

		if (!_.isUndefined(current))
			current.endTurn();

		if (!_.isUndefined(next))
			next.startTurn();
	}

	// Set the uniqueName in each character
	CharacterCollection.prototype.uniqueName = function(obj) {
		var names = _.uniq(_.map(this.characters, 'name'));

		var c = this.characters;
		_.each(names, function(name) {
			var occurences = _.filter(c, {name: name});
			if (occurences.length != 1)
				_.each(occurences, function(obj) { obj.set('uniqueName', false); });
		});
	}

	CharacterCollection.prototype.resetOrder = function() {
		_.each(this.characters, function(obj) {
			obj.calculateInitiation();
			obj.resetOrder();
		});
	}

	CharacterCollection.prototype.order = function() {
		this.resetOrder();

		var orderCounter = 1;

		while (!_.isUndefined(_.find(this.characters, {'initiation_order': 0})))
			_.maxBy(_.filter(this.characters, {'initiation_order': 0}), 'initiation').set('initiation_order', orderCounter++);
	}


	// Run ordering after the inputs!
	CharacterCollection.prototype.randomNPC = function() {
		_.each(_.filter(this.characters, {'npc': true}), function(obj) {
			obj.random();
		});
	}

	CharacterCollection.prototype.randomAll = function() {
		_.each(this.characters, function(obj) {
			obj.random();
		});
		this.order();
	}

})();