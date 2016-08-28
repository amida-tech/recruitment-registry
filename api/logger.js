const winston = require('winston');
const expressWinston = require('express-winston');

module.exports = expressWinston.logger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        })
    ],
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: true
});