const {sendInProgressGameUpdate} = require('../util.js'),
	{games} = require('../models.js')
	// ,
	// _ = require('lodash')
;

module.exports.policyPeek = game => {
	const {seatedPlayers} = game.private,
		{presidentIndex} = game.gameState,
		president = seatedPlayers[presidentIndex];

	game.general.status = 'Waiting for President to peek at policies';
	game.publicPlayersState[presidentIndex].isLoader = true;
	president.playersState[presidentIndex].policyNotification = true;
	sendInProgressGameUpdate(game);
};

module.exports.selectPolicies = data => {
	const game = games.find(el => el.general.uid === data.uid),
		{presidentIndex} = game.gameState,
		{seatedPlayers} = game.private,
		president = seatedPlayers[presidentIndex],
		{policies} = game.private;

	if (policies.length > 2) {
		president.cardFlingerState = [
			{
				position: 'middle-far-left',
				action: 'active',
				cardStatus: {
					isFlipped: false,
					cardFront: 'policy',
					cardBack: `${policies[0]}p`
				}
			},
			{
				position: 'middle-center',
				action: 'active',
				cardStatus: {
					isFlipped: false,
					cardFront: 'policy',
					cardBack: `${policies[1]}p`
				}
			},
			{
				position: 'middle-far-right',
				action: 'active',
				cardStatus: {
					isFlipped: false,
					cardFront: 'policy',
					cardBack: `${policies[2]}p`
				}
			}
		];
		sendInProgressGameUpdate(game);

		setTimeout(() => {
			president.cardFlingerState[0].cardStatus.isFlipped = president.cardFlingerState[1].cardStatus.isFlipped = president.cardFlingerState[2].cardStatus.isFlipped = true;
			sendInProgressGameUpdate(game);
		}, 2000);

		setTimeout(() => {
			president.cardFlingerState[0].cardStatus.isFlipped = president.cardFlingerState[1].cardStatus.isFlipped = president.cardFlingerState[2].cardStatus.isFlipped = false;
			president.cardFlingerState[0].action = president.cardFlingerState[1].action = president.cardFlingerState[2].action = '';
			sendInProgressGameUpdate(game);
		}, 4000);

		setTimeout(() => {
			president.cardFlingerState = [];
			president.gameChats.push({
				gameChat: true,
				timestamp: new Date(),
				chat: [
					{text: 'You peek at the top 3 policies and see that they are a '},
					{
						text: policies[0],
						type: policies[0]
					},
					{text: ', a '},
					{
						text: policies[1],
						type: policies[1]
					},
					{text: ', and a '},
					{
						text: policies[2],
						type: policies[2]
					},
					{text: ' policy.'}
				]
			});
			sendInProgressGameUpdate(game);
		}, 6000);
	} else {
		// todo-alpha
	}
};

module.exports.investigateLoyalty = game => {
	const {seatedPlayers} = game.private,
		{presidentIndex} = game.gameState,
		president = seatedPlayers[presidentIndex];

	game.general.status = 'Waiting for President to investigate.';
	president.playersState.filter((player, i) => i !== presidentIndex && !seatedPlayers[i].isDead).forEach(player => {
		player.notificationStatus = 'notification';
	});
	game.publicPlayersState[presidentIndex].isLoader = true;
	game.gameState.clickActionInfo = [president.userName, seatedPlayers.filter((player, i) => i !== presidentIndex && !seatedPlayers[i].isDead).map(player => seatedPlayers.indexOf(player))];
	game.gameState.phase = 'selectingPolicyInvestigate';
	sendInProgressGameUpdate(game);
};

module.exports.selectPolicyInvestigate = data => {
	const game = games.find(el => el.general.uid === data.uid),
		{playerIndex} = data,
		{presidentIndex} = game.gameState,
		{seatedPlayers} = game.private,
		president = seatedPlayers[presidentIndex],
		playersTeam = game.private.seatedPlayers[playerIndex].role.team;

	president.playersState.forEach(player => {
		player.notificationStatus = '';
	});

	game.publicPlayersState[presidentIndex].isLoader = false;
	game.publicPlayersState[playerIndex].cardStatus = {
		cardDisplayed: true,
		cardFront: 'partymembership',
		cardBack: {}
	};

	sendInProgressGameUpdate(game);

	setTimeout(() => {
		const chat = {
			timestamp: new Date(),
			gameChat: true
		};

		president.playersState[playerIndex].cardStatus = {
			isFlipped: true,
			cardBack: {
				cardName: `membership-${playersTeam}`
			}
		};

		seatedPlayers.filter(player => player.userName !== president.userName).forEach(player => {
			chat.chat = [{text: 'President '},
			{
				text: president.userName,
				type: 'player'
			},
			{text: ' investigates the party membership of '},
			{
				text: seatedPlayers[playerIndex].userName,
				type: 'player'
			},
			{text: '.'}];

			player.gameChats.push(chat);
		});

		game.private.unSeatedGameChats.push(chat);

		president.gameChats.push({
			timestamp: new Date(),
			gameChat: true,
			chat: [{text: 'You investigate the party membership of '},
			{
				text: seatedPlayers[playerIndex].userName,
				type: 'player'
			},
			{text: ' and determine that he or she is on the '},
			{
				text: playersTeam,
				type: playersTeam
			},
			{text: ' team.'}]
		});

		sendInProgressGameUpdate(game);
	}, 2000);

	setTimeout(() => {
		president.playersState[playerIndex].cardStatus.isFlipped = false;
		sendInProgressGameUpdate(game);
	}, 4000);

	setTimeout(() => {
		game.publicPlayersState[playerIndex].cardStatus.cardDisplayed = false;
		game.gameState.presidentIndex = game.gameState.presidentIndex === game.general.livingPlayerCount ? 0 : game.gameState.presidentIndex + 1; // todo-alpha skip dead players
		sendInProgressGameUpdate(game);
	}, 6000);
};