(function () {
    'use strict';

    module.exports = Log;

    Log.$inject = ['plugins', 'config'];
    function Log(plugins, config) {
        var self = this;
        var winston = plugins.winston;

        var transports = [ new winston.transports.File({ filename: __dirname + './../../' + config.log.logFile, level: config.log.level }) ];
        var exceptionHandlers = [ new winston.transports.File({ filename: __dirname + './../../' + config.log.exceptions }) ];

        if (config.log.console) {
            transports.push(new winston.transports.Console({level: config.log.level}));
            exceptionHandlers.push(new winston.transports.Console({level: config.log.level}));
        }

        var logger = new (winston.Logger)({
            transports: transports,
            exceptionHandlers: exceptionHandlers
        });

        self.error = function(text) {
            return logger.error(text);
        };

        self.info = function(text) {
            return logger.info(text);
        };

        self.debug = function(text) {
            return logger.debug(text);
        };
    }
})();