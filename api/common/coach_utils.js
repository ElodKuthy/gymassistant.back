(function () {
    'use strict';

    var container = require('../container.js');

    module.exports = Utils;

    Utils.$inject = ['log', 'plugins', 'config'];
    function Utils(log, plugins, config) {
        var self = this;
        var url = config.db.server + config.db.name;
        var q = plugins.q;
        var moment = plugins.moment;

        self.addKey = function(key) {
            return key ? (key.length === 2 ? ('?startkey="' + key[0] + '"&endkey="' + key[1] + '"') : ('?key="' + key + '"')) : '';
        };

        self.addDateKey = function(key) {
            return key ? (key.length === 2 ? ('?startkey=' + moment(key[0]).unix() + '&endkey=' + moment(key[1]).unix()) : ('?key=' + moment(key).unix())) : '';
        };
        self.createDb = function() {
            return self.request('PUT', '', '');
        };

        self.deleteDb = function() {
            return self.request('DELETE', '', '');
        };

        self.request = function(method, request, body) {
            var deferred = q.defer();

            log.debug('request: ' + method + ' ' + url + '/' + request + (body ? ' body: ' + JSON.stringify(body) : ''));
            plugins.request({
                method: method,
                url: url + '/' + (request ? request : ''),
                body: (body ? JSON.stringify(body) : '')
            }, function(error, response, body) {
                log.debug('error: ' + error);
                if (error) {
                    log.error(error);
                    deferred.reject(error);
                } else {
                    var bodyParsed = JSON.parse(body);
                    if (bodyParsed.error) {
                        log.error(bodyParsed);
                        deferred.reject(bodyParsed);
                    } else if (bodyParsed.rows){
                        var results = [];
                        bodyParsed.rows.forEach(function (row) {
                            results.push(row.value);
                        });
                        deferred.resolve(results);
                    } else {
                        deferred.resolve(bodyParsed);
                    }
                }
            });

            return deferred.promise;
        };
    }

})();
