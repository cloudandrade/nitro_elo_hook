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
		res.send({ msg: 'Hello! NitroEloHook Working!' });
	} catch (error) {
		logger.error('falha ao computar atributos do servidor' + error);
	}
});

//================================= ELOS

routes.get('/elos', async (req, res) => {
	let { summoner, contractor, contractorHash } = req.query;

	if (summoner) {
		logger.debug(`Foi requisitado elo do jogador: ${summoner} em League of Legends`);
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

//#######################################################################################
//separando rotas por jogos  ------------------------------------------------------------
//#######################################################################################

//--> hook de league of legends --> scraping from leagueofgraphs
routes.get('/lol', async (req, res) => {
	let { name } = req.query;
	let elo;
	let erro;

	if (name) {
		await axios
			.get(`https://www.leagueofgraphs.com/pt/summoner/br/${name}`)
			.then((resp) => {
				console.log(resp.status);
				const $ = cheerio.load(resp.data);
				const pickLolElo = $('.leagueTier').html();
				elo = pickLolElo.trim();
				res.send(elo);
			})
			.catch((error) => {
				console.log(error);
				switch (error.response.status) {
					case 404:
						logger.info(
							'Player não encotrado. '.yellow + error.response.statusText
						);
						erro = 'Player não encotrado';
						res.send(erro);
						break;
					case 500:
						logger.error(
							'Erro desconhecido no serviço de busca. ' +
								error.response.statusText
						);
						erro = 'Erro desconhecido no serviço de busca';
						res.send(erro);
						break;
					case 401:
						logger.error(
							'Busca não autorizada, usuário privado. '.yellow +
								error.response.statusText
						);
						erro = 'Erro desconhecido no serviço de busca';
						res.send(erro);
						break;
					default:
						logger.error('Erro não tratado. ' + error);
						erro = 'Erro desconhecido no serviço gateway';
						res.send(erro);
						break;
				}
			});
	} else {
		res.send('Não existe jogador a ser buscado!');
	}
});

//-->hook de valorant ---> scraping from tracker.gg
routes.get('/valorant', async (req, res) => {
	let { name, hash } = req.query;
	let elo;
	let erro;

	if (name) {
		if (hash) {
			await axios
				.get(
					`https://tracker.gg/valorant/profile/riot/${name}%23${hash}/overview?playlist=competitive`
				)
				.then((resp) => {
					const $ = cheerio.load(resp.data);

					const pickValoElo = $('.valorant-highlighted-stat__value').html();

					elo = pickValoElo.trim();
					res.send(elo);
				})
				.catch((error) => {
					switch (error.response.status) {
						case 404:
							logger.info(
								'Player não encotrado. '.yellow +
									error.response.statusText
							);
							erro = 'Player não encotrado';
							res.send(erro);
							break;
						case 500:
							logger.error(
								'Erro desconhecido no serviço de busca. ' +
									error.response.statusText
							);
							erro = 'Erro desconhecido no serviço de busca';
							res.send(erro);
							break;
						case 401:
							logger.error(
								'Busca não autorizada, usuário privado. '.yellow +
									error.response.statusText
							);
							erro = 'Erro desconhecido no serviço de busca';
							res.send(erro);
							break;
						default:
							logger.error('Erro não tratado. ' + error);
							erro = 'Erro desconhecido no serviço gateway';
							res.send(erro);
							break;
					}
				});
		} else {
			res.send('Não é possível localizar um jogador sem o hash ID!');
		}
	} else {
		res.send('Não existe jogador a ser buscado!');
	}
});

module.exports = routes;
