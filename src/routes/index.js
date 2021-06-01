const { Router } = require('express');
const os = require('os-utils');
const axios = require('axios');
const cheerio = require('cheerio');
const Logger = require('../services/logger_service');
const routes = Router();

const logger = new Logger('requisitions');
//================================= SERVER
//NEH - Nitro Elo Hook

routes.get('/', async (req, res) => {
	try {
		res.send({ msg: 'Hello! NitroEloHook Working!' });
	} catch (error) {
		logger.error('falha ao computar atributos do servidor' + error);
	}
});

//================================= ELOS

routes.get('/elos', async (req, res) => {
	let { summoner, contractor, contractorHash } = req.query;

	let response = {};
	await getElos(summoner, contractor, contractorHash).then((elos) => {
		if (summoner) {
			logger.debug(
				`Foi requisitado elo do jogador: ${summoner} em League of Legends`
			);
		}
		if (contractor) {
			logger.debug(`Foi requisitado elo do jogador: ${contractor} em Valorant`);
		}
		response = elos;
		res.send(response);
	});
});

//====================================SCRAPING ELO FUNCTION
async function getElos(summonerName, contractor, contractorHash) {
	let elos = {};

	//se o invocador for passado por parametro ele irá buscar o elo
	if (summonerName) {
		let game1 = {};
		try {
			await axios
				.get(`https://www.leagueofgraphs.com/pt/summoner/br/${summonerName}`)
				.then((res) => {
					const $ = cheerio.load(res.data);
					const pickLolElo = $('.leagueTier').html();

					game1.name = 'League of Legends';
					game1.summoner = summonerName;
					game1.elo = pickLolElo.trim();
					elos.game1 = game1;
				});
		} catch (error) {
			logger.error(
				'Falha ao buscar elo de invocador em league of legends - ' + error
			);
		}
	}

	//se o contratante, ou seja, o jogador de valorant for passado, ele irá buscar o elo
	if (contractor && contractorHash) {
		let game2 = {};
		try {
			await axios
				.get(
					`https://tracker.gg/valorant/profile/riot/${contractor}%23${contractorHash}/overview?playlist=competitive`
				)
				.then((res) => {
					const $ = cheerio.load(res.data);

					const pickValoElo = $('.valorant-highlighted-stat__value').html();

					game2.name = 'Valorant';
					game2.summoner = summonerName;
					game2.elo = pickValoElo.trim();
					elos.game2 = game2;
				});
		} catch (error) {
			logger.error('Falha ao buscar elo de contratante em valorant - ' + error);
		}
	}

	return elos;
}

module.exports = routes;
