(function () {
    'use strict';

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

        self.updateDoc = function(id, update, retries) {

            var deferred = q.defer();
            var currentTry = isNaN(retries) ? 1 : retries + 1;

            return self.get(id)
                .then(update)
                .then(function (doc) {
                    return self.put(id, doc);
                })
                .catch(function (error) {
                    if (currentTry <= 10 && error.message.indexOf('Document update conflict.') > -1) {
                        return self.updateDoc(id, update, currentTry);
                    } else {
                        throw error;
                    }
                });
        };

        self.get = function (request) {
            return self.request('GET', request);
        };

        self.put = function(request, body) {
            return self.request('PUT', request, body);
        };

        self.request = function(method, request, body) {

            log.debug('request: ' + method + ' ' + url + '/' + request + (body ? ' body: ' + JSON.stringify(body) : ''));

            return q.denodeify(plugins.request)({
                method: method,
                url: url + '/' + (request ? request : ''),
                body: (body ? JSON.stringify(body) : '')
            })
            .then(function (results) {
                var parsed = JSON.parse(results[1]);

                if (parsed.error) {
                    throw new Error(results[1]);
                }

                if (parsed.rows) {
                    var rows = [];
                    parsed.rows.forEach(function (row) {
                        rows.push(row.value);
                    });
                    return rows;
                }

                return parsed;
            });
        };
    }

})();
