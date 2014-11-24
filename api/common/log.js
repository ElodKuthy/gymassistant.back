(function () {
    "use strict";

    exports.error = error;
    exports.info = info;
    exports.debug = debug;

    var winston = require('winston');

    var config = require("./config.js");

    var transports = [ new winston.transports.File({ filename: __dirname + "./../../" + config.log.logFile, level: config.log.level }) ];
    var exceptionHandlers = [ new winston.transports.File({ filename: __dirname + "./../../" + config.log.exceptions }) ];

    if (config.log.console) {
        transports.push(new winston.transports.Console({level: config.log.level}));
        exceptionHandlers.push(new winston.transports.Console({level: config.log.level}));
    }

    var logger = new (winston.Logger)({
        transports: transports,
        exceptionHandlers: exceptionHandlers
    });

    function error(text) {
        return logger.error(text);
    }

    function info(text) {
        return logger.info(text);
    }

    function debug(text) {
        return logger.debug(text);
    }
})();