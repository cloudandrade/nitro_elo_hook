const { Router } = require('express');
const os = require('os-utils');
const axios = require('axios');
const cheerio = require('cheerio');
const Logger = require('../services/logger_service');
const routes = Router();

const logger = new Logger('server');
//================================= SERVER
//NEH - Nitro Elo Hook

routes.get('/', async (req, res) => {
	try {
	

		res.send({msg:"Hello! NitroEloHook Working!"});
	} catch (error) {
		logger.error('falha ao computar atributos do servidor' + error);
	}
});

//================================= ELOS

routes.get('/elos', async (req, res) => {
	let { summoner, contractor, contractorHash } = req.query;


	if (summoner) {
		logger.debug(
			`Foi requisitado elo do jogador: ${summoner} em League of Legends`
		);
	}
	if (contractor) {
		logger.debug(`Foi requisitado elo do jogador: ${contractor} em Valorant`);
	}
	
	let response = {};
	await getElos(summoner, contractor, contractorHash).then((elos) => {
		
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
	
			await axios
				.get(`https://www.leagueofgraphs.com/pt/summoner/br/${summonerName}`)
				.then((res) => {
					console.log(res.status);
					const $ = cheerio.load(res.data);
					const pickLolElo = $('.leagueTier').html();

					game1.name = 'League of Legends';
					game1.summoner = summonerName;
					game1.elo = pickLolElo.trim();
					elos.game1 = game1;
				}).catch(error => {
					switch (error.response.status) {
						case 404:
							logger.info("Player não encotrado. ".yellow + error.response.statusText);
							game1.erro = "Player não encotrado";
							elos.game1 = game1;
							break;
						case 500:
							logger.error("Erro desconhecido no serviço de busca. " + error.response.statusText);
							game1.erro = "Erro desconhecido no serviço de busca";
							elos.game1 = game1;
							break;
						case 401:
							logger.error("Busca não autorizada, usuário privado. ".yellow + error.response.statusText);
							game1.erro = "Erro desconhecido no serviço de busca";
							elos.game1 = game1;
							break;
						default:
							logger.error("Erro não tratado. " + error);
							game1.erro = "Erro desconhecido no serviço gateway";
							elos.game1 = game1;
							break;
					}
				});
		
	}

	//se o contratante, ou seja, o jogador de valorant for passado, ele irá buscar o elo
	if (contractor && contractorHash) {
		let game2 = {};
		
			await axios
				.get(
					`https://tracker.gg/valorant/profile/riot/${contractor}%23${contractorHash}/overview?playlist=competitive`
				)
				.then((res) => {
					const $ = cheerio.load(res.data);

					const pickValoElo = $('.valorant-highlighted-stat__value').html();

					game2.name = 'League of Legends';
					game2.summoner = summonerName;
					game2.elo = pickValoElo.trim();
					elos.game2 = game2;
				}).catch(error => {
					switch (error.response.status) {
						case 404:
							logger.info("Player não encotrado. ".yellow + error.response.statusText);
							game2.erro = "Player não encotrado";
							elos.game2 = game2;
							break;
						case 500:
							logger.error("Erro desconhecido no serviço de busca. " + error.response.statusText);
							game2.erro = "Erro desconhecido no serviço de busca";
							elos.game2 = game2;
							break;
						case 401:
							logger.error("Busca não autorizada, usuário privado. ".yellow + error.response.statusText);
							game2.erro = "Erro desconhecido no serviço de busca";
							elos.game2 = game2;
							break;
						default:
							logger.error("Erro não tratado. " + error);
							game2.erro = "Erro desconhecido no serviço gateway";
							elos.game2 = game2;
							break;
					}
				});
	
	}

	return elos;
}



module.exports = routes;
