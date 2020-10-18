var app = angular.module('rpgLog', []);

app.controller('logCtrl', function($scope, $http){
	$scope.form = [];
	$scope.files = [];
	$scope.toggleLog = true;
	$scope.date = new Date();
	$scope.success = false;
	$scope.playersForPlay = {};
	$scope.dateToLog = new Date();
	
	$.backstretch("img/unsplash.jpg");
	$scope.gms = [];
	$scope.charactersToLog = [];
	$scope.gamePlayerCamps = {};
	
	$scope.formatDate = function(date)
	{
	  var d=new Date(date);
	  var year = d.getFullYear();
	  var month = d.getMonth()+1;
	  if (month < 10 ){
		month="0" + month;
	  };
	  var day=d.getDate();
	  if (day < 10){
		day = "0" + day;
	  };
	  return year + "-" + month + "-" + day;
	}
	$http.post('src/php/getLogs.php').then(function successCB(data){
		$scope.plays = data.data;
		$scope.plays.map( (play) => {
			play.length = Number(play.length);
		});
	});
	
	$http.post('src/php/getGames.php').then(function successCB(data){
		$scope.games = data.data;
	});
	
	$http.post('src/php/getPlayerNames.php').then(function successCB(data){
		$scope.playerNames = data.data;
	});

	$http.post('src/php/getCampaigns.php').then(function successCB(data){
		$scope.campaigns = data.data;
	});
	
	$http.post('src/php/getCharacters.php').then(function successCB(data){
		$scope.characters = data.data;
	});

	$http.post('src/php/getPlayers.php').then( (result) => {
		$scope.players = result.data;
		$scope.players.forEach( (player) => {
			appendToList(player);
		});
	});

	$scope.toReadableDate = function(date) {
		date = new Date(date);
		date = date.toUTCString();
		let parts = date.split(' ');
		
		return parts[0] + ' ' + parts[2] + ' ' + parts[1] + ' ' + parts[3];
	}

	function appendToList(player) {
		if(!$scope.playersForPlay[player.playid]) {
			$scope.playersForPlay[player.playid] = {'gm' : [], 'player' : []};	
		}
		player.isgm !== "0" ? 
			$scope.playersForPlay[player.playid].gm.push(player) :
			$scope.playersForPlay[player.playid].player.push(player); 
	}
	
	$scope.setGm = function(isChecked, player) {
		$scope.gms[player.id] = isChecked;
	}
	
	$scope.confirmPlayerDelete = async function(player, play) {
		if (confirm("Are you sure you want to delete " + player.name + " from this play?")) {
			const result = await $http.post('src/php/deletePlayerFromPlay.php?playid='+player.playid+'&playerid='+player.id);
			
			let idx;
			play.players.forEach( (plr, i) => {
				if (plr.id === player.id) {
					idx = i;
					return;
				}					
			});
			play.players.splice(idx, 1);
			refreshPlays();
			return result;
		}
		return false;
	}
	
	$scope.pwprompt = async function() {
		const pin = prompt("Please enter a password", "");
		// console.log(pin);
		$http({
		  method: 'POST',
		  url: 'src/php/checkpin.php',
		  data: JSON.stringify(pin)
		})
		.then(function (success) {
		  // console.log("Success", success);
		  $scope.enableEditMode = success.data == "1";
		  return true;
		}, function (error) {
		  console.log(error);
		  return false;
		});
	}
	
	$scope.pwpromptIfReadonly = async function () {
		if(!$scope.enableEditMode) {
			return await $scope.pwprompt();
		}
		return true;
	}
	
	$scope.deletePlay = async function(playid) {
		// Delete from DB
		const result = await $http.post('src/php/deletePlay.php?id='+playid);
		
		// Then delete from UI
		$scope.$apply( () => {
			$scope.plays = $scope.plays.filter( play => play.id !== playid);
		});
	}
	
	$scope.getStats = async function(player, year) {
		// All plays for player
		$scope.uniquePlays = await getUniquePlays(player.id, year); 

		// Campaign Plays for player
		let campPlays = await getAllCampaignPlaysForPlayer(player.id, year);
		$scope.allgames = mergePlays($scope.uniquePlays.slice(0), campPlays);
		
		// Days by Date
		const playedDates = await getGamesByDate(player.id, year);
		$scope.gamesByDays = datesToDays(playedDates);
		
		$scope.playedWith = await getPlayedWith(player.id, year);
		
		$scope.playedAs = await getPlayedAs(player.id, year)
		//createChart(transformDataForPiChart($scope.playedAs), "chartContainer");
		createPieChart(formatForPieChart($scope.playedAs), "chartContainer");
		
		$scope.playedAsChar = await getPlayedAsChar(player.id, year);
		//createChart(transformDataForPiChart($scope.playedAsChar), "chartContainer2");
		createPieChart(formatForPieChart($scope.playedAsChar), "chartContainer2");
		
		// Add more here
		$scope.$apply();
	}
	
	$scope.gameShowStates = {};
	
	$scope.isShowing = function(gameid) {
		return !!$scope.gameShowStates[gameid];
	}
	
	// The id is the id of the div this
	// Will go in
	function createPieChart(inputData, id) {
		google.charts.load('current', {'packages':['corechart']});
		google.charts.setOnLoadCallback(drawChart);

		function drawChart() {
		var data = google.visualization.arrayToDataTable(inputData);
		var options = {
		  title: 'Characters played'
		};

		var chart = new google.visualization.PieChart(document.getElementById(id));

		chart.draw(data, options);
		}
	}
	
	$scope.updatePlayers = async function (play) {
		const playid = play.id;

		
		let playerIds = [];
		let unknownPlayers = [];
		play.players.forEach( (player) => {
			if(player.id) {
				playerIds.push(parseInt(player.id));
			} else {
				unknownPlayers.push(player.name);
			}
		});
		let newIds = await addNewPlayers(unknownPlayers);
		playerIds = playerIds.concat(newIds);
		
		await updatePlayerPlays(playerIds, playid);
	}
	
	// Takes an array of player ids (playerIds) and the playid
	async function updatePlayerPlays(playerIds, playId) {
		let promises = [];
		playerIds.forEach((id) => {
			promises.push($http.post('src/php/updatePlayerPlays.php?playerId='+id+'&playId='+playId));
		});
		let result = await Promise.all(promises);
		return result.map( res => parseInt(res.data));
	}
	
	$scope.shouldShow = function(play) {
		if(!play) { return false; }
		return !play.iscampaign || (play.iscampaign && $scope.isShowing(play.gameid));
	}
	
	$scope.editPlay = function(play) {
		play.dateplayed = new Date(play.dateplayed);
		play.dateplayed.setMinutes(play.dateplayed.getMinutes() + play.dateplayed.getTimezoneOffset());
		
		$scope.editing = play;
		
		$scope.editing.game = {"name": play.name, "id": play.gameid}
		$scope.editing.campaign = {"name" : play.campaignName, "id": play.campaignid}
		
		const gms = $scope.getGms(play.id);
		gms.map( (gm) => {gm.isgm = true});
		let temp = $scope.getPlayers(play.id).concat(gms);
		
		$scope.editing.players = [];
		temp.forEach( (player) => {
			let newplayer = {};
			newplayer.name =  player.name;
			newplayer.id =  player.id;
			newplayer.playid =  player.playid;
			newplayer.playerid =  player.playerid;
			newplayer.isgm =  player.isgm;
			newplayer.charname =  player.charname;
			newplayer.class =  player.class;
			
			$scope.editing.players.push( 
				angular.copy(newplayer)
			);
		});
		
		document.getElementById('add').scrollIntoView();
		document.getElementById('edit').scrollIntoView();
	//	$scope.editing = undefined;
	}
	
	$scope.clonePlay = function(play) {
		$scope.dateToLog = new Date();

		$scope.gameToLog = $scope.games.find( (game) => game.id === play.gameid);
		$scope.campaignToLog = $scope.campaigns.find( (campaign) => campaign.id ===play.campaignid);
		
		$scope.lengthToLog = play.length;

		// Players and GMs
		$scope.gms = [];
		const gms = $scope.getGms(play.id);
		gms.map( (gm) => {gm.isgm = true});
		const playersAndGms = $scope.getPlayers(play.id).concat(gms);
		const playerAndGmIds = playersAndGms.map( (player) => player.id);		
		$scope.playersToLog = $scope.playerNames.filter( (player) => playerAndGmIds.includes(player.id));
		
		$scope.playersToLog.forEach( (player) =>  {
			let person = playersAndGms.find( (person) => person.playerid === player.id);
			let isgm = person.isgm == false ? false : true; // isgm is coming in as "0", so !! won't work
			player.isgm = $scope.gms[player.id] = isgm;
		});
		
		$scope.charactersToLog = [];
		playersAndGms.forEach( (player) => {
			if(player.characterid) {
				
				//This may not work if 2 or more people play the same character.
				const newChar = $scope.characters.find((character) => character.id === player.characterid);
				newChar.playerid = player.playerid;
				newChar.charId = player.characterid;

				$scope.charactersToLog.push(newChar);
				$scope.playersToLog.find( (person) => person.id === player.playerid).characterToLog = newChar;
			}
		});
		
		document.getElementById('add').scrollIntoView();
		document.getElementById('edit').scrollIntoView();
	}
	
	$scope.editLength = async function(play) {
		console.log(play);
		let ret;
		const response = await $http.post('src/php/updateLength.php?playid='+play.id+'&length='+play.length);
		ret = response.data;
		refreshPlays();
		return ret;
	}
	
	$scope.updateCharater = async function(play, info) {
		console.log(play, info);
		const playerid = info.playerid;
		const playid = play.id;
		const characterid = info.charId;
		const response = await $http.post('src/php/updateCharacters.php?playid='+playid+'&charId='+characterid+'&playerid='+playerid);
		let ret = response.data;
		refreshPlays();
		return ret;
	}
	
	$scope.editGm = async function(isChecked, player, play) {
		const shouldCheck = isChecked ? 1 : 0;
		const response = await $http.post('src/php/updateIsGm.php?playid='+play.id+'&isgm='+shouldCheck+'&playerid='+player.id);
		let ret = response.data;
		refreshPlays();
		return ret;
	}
	
	// Update a given play to use an existing campaign
	// For example changing a play from Minutemen to
	// Tales from the Gas Station when both are in the system
	$scope.changeCampaignForPlay = async function(play) {
		let ret;
		if(play.campaign.id !== play.campaignid) {
			console.log(play)
			const response = await $http.post('src/php/updateCampaignId.php?playid='+play.id+'&campaignid='+play.campaign.id);
			ret = response.data;
		}
		refreshPlays();
		return ret;
	}
	
	// Adds a new campaign, gets its id,
	// Then changes the play to use this
	// New campaign.
	// For example changing from Tales from the Gas Station
	// To Hereo Party when Hero Party is not in the system.
	$scope.editCampaignName = async function (play) {
		if(!(play.campaign.id)) {
			const newCampaignId = campaignid = await addNewCampaign(play.campaign.name);
			play.campaign.id = newCampaignId;
			await $scope.changeCampaignForPlay(play);
		}
	}

	// Adds a new game, gets its id,
	// Then changes the play to use this
	// New game.
	// For example changing from D&D 5e
	// To D&D 11e when 11e is not in the system.
	$scope.editGameName = async function (play) {
		if(!(play.game.id)) {
			const newGameId = await addNewGame(play.game.name);
			play.game.id = newGameId;
			await $scope.changeGameForPlay(play);
		}
	}
	
	// Update a given play to use an existing game
	// For example changing a play from d&d 4e to
	// D&d 5e when both are in the system
	$scope.changeGameForPlay = async function(play) {
		let ret;
		if(play.game.id !== play.gameid) {
			console.log(play)
			const response = await $http.post('src/php/updateGameId.php?playid='+play.id+'&gameid='+play.game.id);
			ret = response.data;
		}
		refreshPlays();
		return ret;
	}

	$scope.updateDate = async function(play) {
		const date = $scope.formatDate(play.dateplayed);
		console.log(play);
		console.log(date);
		const response = await $http.post('src/php/updatePlayDates.php?playid='+play.id+'&datePlayed='+date);
		console.log(response);
		const data = response.data;
		let result = [];
		for(let i = 0; i < data.length; i+=2) {
			result.push({
				"name": data[i],
				"count" : data[i+1]
			}); 
		}
		return result;
	}

	$scope.confirmDelete = function(play) {
		let ret = confirm("Are you sure you want to delete this play of " + play.name + "?")
		if(ret) {
			$scope.deletePlay(play.id);
			refreshPlays();
		}
	}

	$scope.getHours = function(arr) {
		let ret = arr.reduce((a,b)=>{
				return a + parseInt(b.length,10)},0);
		return ret;
	}

	$scope.getNumGames = function(arr) {
		let ret = arr.reduce((a,b)=>{
				return a + (b.iscampaign ? 0 : b.count)},0);
		return ret;
	}

	const refreshPlays = async function() {
		const response = await $http.post('src/php/getLogs.php');
		$scope.plays = response.data;
		
		$scope.playersForPlay = {}; 
		const result = await $http.post('src/php/getPlayers.php');
		$scope.players = result.data;
		$scope.players.forEach( (player) => {
			appendToList(player);
		});
		
		$scope.$apply();
	}
	
	function formatForPieChart(data) {
		let ret = [ ['Name', 'Count']]
		data.map( (item) => {
			ret.push(
				[item.name, item.count]
			);
		});
		return ret;
	}
	
	// Returns an array of how many times a given 
	// Player id played each class
	// Each play counts once
	async function getPlayedAs(playerid, year) {
		const response = await $http.post('src/php/readPlaysAsSingle.php?playerid='+playerid+'&year='+year);
		const data = response.data;
		let result = [];
		for(let i = 0; i < data.length; i+=2) {
			result.push({
				"name": data[i],
				"count" : data[i+1]
			}); 
		}
		return result;
	}
	
	// Returns an array of how many times a given 
	// Player id played each class
	// Each charactger counts once
	async function getPlayedAsChar(playerid, year) {
		const response = await $http.post('src/php/readPlaysAsMultiple.php?playerid='+playerid+'&year='+year);
		const data = response.data;
		let result = [];
		for(let i = 0; i < data.length; i+=2) {
			result.push({
				"name": data[i],
				"count" : data[i+1]
			}); 
		}
		return result;
	}
	
	function transformDataForPiChart(data) {
		let sum = data.reduce( (a, b) => {
			return a + b.count;
		}, 0);
		let ret = [];
		data.map( (item) => {
			let num = 100.0 * item.count / sum;
			num = num.toFixed(2);
			ret.push(
				{
					"y": num,
					"name": item.name
				}
			);
		});
		return ret;
	}
	
	function createChart(inputData, name) {
		var chart = new CanvasJS.Chart(name, {
			exportEnabled: false,
			animationEnabled: false,
			title:{
				text: "Times played each class"
			},
			legend:{
				cursor: "pointer"
			},
			data: [{
				type: "pie",
				showInLegend: true,
				toolTipContent: "{name}: <strong>{y}%</strong>",
				indexLabel: "{name} - {y}%",
				dataPoints: inputData
			}]
		});
		chart.render();
	}
	
	// Takes in a string like "Mon"
	// Returns the relative bar height
	$scope.getHeightForDay = function(day) {
		const maxHeight = 425;
		const maxDay = $scope.getMax($scope.gamesByDays);
		const dayHeight = $scope.gamesByDays[day];
		let ret =  1.0 * dayHeight / $scope.nearest5Multiple(maxDay) * maxHeight;
		return ret;
	}		
	
	$scope.getMax = function(object) {
		let max = 0;
		Object.values(object).forEach( (item) => {
			if( item > max) {
				max = item;
			}
		});
		return max;
	}
	
	$scope.nearest5Multiple = function(input) {
		return input + (5 - input % 5);
	}
	
	// Takes in an array of dates and 
	// Returns an object in the form of
	// Keys [Mon, Tue, etc] and values
	// [1, 4, etc] where the value is
	// The number of times played on 
	// That weekday
	function datesToDays(dates) {
		let ret = {
			"Mon": 0,
			"Tue": 0,
			"Wed": 0,
			"Thu": 0,
			"Fri": 0,
			"Sat": 0,
			"Sun": 0,
		};
		dates.forEach( (date) => {
			date = new Date(date);
			date = date.toUTCString();
			let parts = date.split(',');
			// parts[0] is the day
			ret[parts[0]]++;
		});
		return ret;
	}
	
	// Returns all dates where games were played in a 
	// Year for given playerid
	async function getGamesByDate(playerid, year) {
		const response = await $http.post('src/php/readPlaysByDate.php?playerid='+playerid+'&year='+year);
		const data = response.data;
		return data;
	}
	
	// Campaigns need to appear immediately
	// After the game they are associated to
	function mergePlays(gameplays, campplays) {
		gameplays.sort((a, b) => (a.id > b.id) ? 1 : -1);
		campplays.sort((a, b) => (a.gameid > b.gameid) ? 1 : -1);
		
		// Populate show state
		gameplays.forEach( (game) => {
			$scope.gameShowStates[game.id] = true;
		});
		let ret = [];
		let lastAdded = -1;
		let idx = 0;
		while(campplays.length && gameplays.length) {
			if(gameplays[0].id <= campplays[0].gameid) {
				ret.push(gameplays.shift());
			} else {
				ret.push(campplays.shift());
			}
		}
		while(gameplays.length) {
			ret.push(gameplays.shift());
		}
		while(campplays.length) {
			ret.push(campplays.shift());
		}
		return ret;
	}
	
	// Returns an array of how many times a given 
	// Player id played with a given player
	async function getPlayedWith(playerid, year) {
		const response = await $http.post('src/php/readPlaysWith.php?playerid='+playerid+'&year='+year);
		const data = response.data;
		let result = [];
		for(let i = 0; i < data.length; i+=2) {
			result.push({
				"name": data[i],
				"count" : data[i+1]
			}); 
		}
		return result;
	}
	
	async function getAllCampaignPlaysForPlayer(playerid, year) {
		const response = await $http.post('src/php/readUniqueCampaignsForPlayer.php?playerid='+playerid+'&year='+year);
		const data = response.data;
		let result = [];
		for(let i = 0; i < data.length; i+=4) {
			result.push({
				"game": data[i],
				"count" : data[i+1],
				"gameid" : data[i+2],
				"dmcount" : data[i+3],
				"iscampaign": true
			}); 
		}
		return result;
	}
	
	async function getUniquePlays(playerid, year) {
		const response = await $http.post('src/php/readUniquePlaysForPlayer.php?playerid='+playerid+'&year='+year);
		const data = response.data;
		let result = [];
		for(let i = 0; i < data.length; i+=5) {
			result.push({
				"id": data[i],
				"game": data[i + 1],
				"count" : data[i + 2],
				"dmcount" : data[i+3],
				"length" : data[i+4]
			}); 
		}
		return result;
	}

	$scope.logAll = async function(dateToLog, gameToLog, players, lengthToLog, campaignToLog, characters) {
		dateToLog = $scope.formatDate(dateToLog);

		// Game
		let gameid = gameToLog.id;
		if(!gameid) {
			gameid = await addNewGame(gameToLog.name);
		}

		//Campaign
		let campaignid = campaignToLog.id;
		if(!campaignid) {
			campaignid = await addNewCampaign(campaignToLog.name);
		}

		// New players
		let playerIds = [];
		let unknownPlayers = [];
		players.forEach( (player) => {
			if(player.id) {
				playerIds.push(parseInt(player.id));
			} else {
				unknownPlayers.push(player.name);
			}
		});
		let newIds = await addNewPlayers(unknownPlayers);
		playerIds = playerIds.concat(newIds);

		// New Characters
		let unknownChars = [];
		let knownChars = []; // The charid will be stored at the index of the playerid
		characters.forEach( (character) => {
			if(character.charId) {
				knownChars[character.playerid] = character.charId;
			} else {
				unknownChars.push(character);
			}
		});
		let newChars = await addNewCharacters(unknownChars);
		
		// Untested code. Should fix the bug where a new player with a new character doesn't log
		let newCharOffset = 0;
		newChars.forEach( (chr) => {
			if(chr[0] === undefined) {
				chr[0] = newIds[newCharOffset]; // Should work if the new characters and players log in the same order. Here be errors?
				newCharOffset++;
			}
			knownChars[chr[0]] = chr[1];
		});

		//Play
		const playId = await logPlay(gameid, dateToLog, lengthToLog, campaignid);

		//Playerplays
		await logPlayerPlays(playerIds, playId, knownChars);
		$scope.gms = [];
		$scope.characters = [];
		refreshPlays();
	}

	// Takes an array of player ids (playerIds) and the playid
	async function logPlayerPlays(playerIds, playId, knownChars) {
		let promises = [];
		playerIds.forEach((id) => {
			let isGm = !!$scope.gms[id]?1:0;
			const charid = knownChars[id];
			promises.push($http.post('src/php/logPlayerPlays.php?playerId='+id+'&playId='+playId+'&isGm='+isGm+'&charid='+charid));
		});
		let result = await Promise.all(promises);
		return result.map( res => parseInt(res.data));
	}

	//Returns the id of the play logged
	async function logPlay(gameid, date, length, campaignid) {
		const result = await $http.post('src/php/logPlay.php?gameid='+gameid+'&date='+date+'&length='+length+'&campaignid='+campaignid);
		return parseInt(result.data);
	}

	// Takes an array of strings (playernames)
	// Returns an array of new playerids.
	async function addNewPlayers(playerNames) {
		let promises = [];
		playerNames.forEach((name) => {
			promises.push($http.post('src/php/addPlayer.php?name='+name));
		});
		let result = await Promise.all(promises);
		return result.map( res => parseInt(res.data));
	}
	
	// Takes an array of Characters and adds them to 
	// The characters table
	// Returns an array of arrays
	// In each array, the first index is the playerId
	// Passed in, the second index is the characterId
	// Returned.
	async function addNewCharacters(characters) {
		let promises = [];
		characters.forEach( (character) => {
			if(character.charClass == undefined) { character.charClass = null; }
			promises.push($http.post('src/php/addCharacter.php?name='+character.charName+'&class='+character.charClass+'&id='+character.playerid))
		});
		let result = await Promise.all(promises);
		
		return result.map( (item) => {
			return item.data.map( (res) => {
				return parseInt(res);
			}); 
		});
	}

	//Returns the id of the game logged
	async function addNewGame(name) {
		const result = await $http.post('src/php/logGame.php?name='+name);
		return parseInt(result.data);
	}

	//Returns the id of the campaign added
	async function addNewCampaign(name) {
		const result = await $http.post('src/php/logCampaign.php?name='+name);
		return parseInt(result.data);
	}


	$scope.getPlayers = function(playid) {
		if(!$scope.playersForPlay[playid]) {
			$scope.playersForPlay[playid] = {'gm' : [], 'player' : []};	
		}
		return $scope.playersForPlay[playid].player;
	}

	$scope.getGms = function(playid) {
		if(!$scope.playersForPlay[playid]) {
			$scope.playersForPlay[playid] = {'gm' : [], 'player' : []};	
		}
		return $scope.playersForPlay[playid].gm;
	}

	
});