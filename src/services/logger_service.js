const winston = require('winston');
const moment = require('moment');
const colors = require('colors');

moment.locale('pt-br');

const dateFormat = () => moment().format('LLLL');

class LoggerService {
	constructor(route) {
		this.log_data = null;
		this.route = route;
		const logger = winston.createLogger({
			transports: [
				//new winston.transports.Console(),
				new winston.transports.File({
					filename: `./logs/${route}.log`,
				}),
			],
			format: winston.format.printf((info) => {
				// Seg, 01 Fev 2020 09:50:13 GMT | INFO/DEBUG/ERROR | main.log (arquivo ao qual o log pertence) | Server Log
				let message;
				let log;

				if (info.level.toString() === 'debug') {
					message = `${dateFormat().toString()} | ${info.level.toUpperCase()} | ${route}.log | ${
						info.message
					} | `;
					log = `${dateFormat().toString().bgGreen} | ${
						info.level.toUpperCase().yellow
					} | ${route}.log | ${info.message} | `;
					console.log(log);
				} else {
					message = `${dateFormat().toString()} | ${
						info.level.toUpperCase().toString() === 'INFO'
							? info.level.toUpperCase()
							: info.level.toUpperCase()
					} | ${route}.log | ${info.message} | `;
					log = `${dateFormat().toString().bgGreen} | ${
						info.level.toUpperCase().toString() === 'INFO'
							? info.level.toUpperCase().blue
							: info.level.toUpperCase().red
					} | ${route}.log | ${info.message} | `;
					console.log(log);
				}

				message = info.obj
					? `${message}data: ${JSON.stringify(info.obj)} | `
					: message;

				message = this.log_data
					? `${message}log_data:${JSON.stringify(this.log_data)} | `
					: message;

				return message;
			}),
		});

		this.logger = logger;
	}

	setLogData(log_data) {
		this.log_data = log_data;
	}

	async info(message) {
		this.logger.log('info', message);
	}

	async info(message, obj) {
		this.logger.log('info', message, {
			obj,
		});
	}

	async debug(message) {
		this.logger.log('debug', message);
	}

	/*   async debug(message, obj) {
    this.logger.log('debug', message, {
      obj,
    });
  } */

	async error(message) {
		this.logger.log('error', message);
	}

	async error(message, obj) {
		this.logger.log('error', message, {
			obj,
		});
	}
}

module.exports = LoggerService;
