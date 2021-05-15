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
		function format(seconds) {
			function pad(s) {
				return (s < 10 ? '0' : '') + s;
			}
			var hours = Math.floor(seconds / (60 * 60));
			var minutes = Math.floor((seconds % (60 * 60)) / 60);
			var seconds = Math.floor(seconds % 60);
			return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
		}

		res.send({
			nomeApp: 'GeekStore Server',
			plataforma: platform(),
			horaAtual: dateTime(),
			tempoAtivoSys: uptime(),
			tempoAtivoApp: format(process.uptime()),
			cpu: await cpuUsage(),
			memoria: memoryUsage(),
		});
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

					game2.name = 'League of Legends';
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

//============================================= FUNCOES DO SISTEMA
function uptime() {
	const minutesTime = os.sysUptime() / 60 / 60;
	const hours = Math.floor(minutesTime);
	const minutes = (minutesTime - hours) * 60;
	return `${hours}h${Math.round(minutes)}m`;
}

function platform() {
	let plataforma = os.platform();
	switch (plataforma) {
		case 'win32':
			plataforma = 'windows';
			break;
		case 'darwin':
			plataforma = 'mac-os';
			break;
		case 'linux':
			plataforma = 'linux';
			break;
		default:
			break;
	}
	return plataforma;
}

function cpuUsage() {
	return new Promise((resolve) => {
		os.cpuUsage((v) => {
			let cpupercent = v.toString().split('.');
			cpupercent = cpupercent[1].substring(0, 2);
			resolve(`${cpupercent}%`);
		});
	});
}

function memoryUsage() {
	let freememory = os.freememPercentage().toString().split('.');
	freememory = freememory[1].substring(0, 2);
	const memoryUsage = 100 - freememory;
	return `${memoryUsage}%`;
}

function dateTime() {
	const dateTimeNow = new Date();
	return `${dateTimeNow.getHours()}h${dateTimeNow.getMinutes()}m${dateTimeNow.getSeconds()}s`;
}

module.exports = routes;
