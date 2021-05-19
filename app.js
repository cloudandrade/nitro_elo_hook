//express used libs
const express = require('express');
var bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
//scrapping used libs

//my used files and variables
const PORT = process.env.PORT || '5000';

const server = express();

const Logger = require('./src/services/logger_service');
const routes = require('./src/routes/index');
const logger = new Logger('server');

server.use(cors());
server.use(routes);

server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

server.listen(PORT, () => {
	logger.info(`Servidor Online na Porta: ${PORT} - Chegou o Reggaeeeee!!!`.bgBlue);
});
