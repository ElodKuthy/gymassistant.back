(function () {
    'use strict';

    module.exports = Users;

    Users.$inject = ['plugins', 'coachUtils', 'log', 'errors'];
    function Users(plugins, coachUtils, log, errors) {
        var self = this;
        var q = plugins.q;
        var request = coachUtils.request;

        self.byNameFull = function (name) {
            return request('GET', '_design/users/_view/byNameFull' + coachUtils.addKey(name));
        };

        self.byName = function (name) {
            return request('GET', '_design/users/_view/byName' + coachUtils.addKey(name));
        };

        self.creditsById = function(id) {
            return request('GET', '_design/credits/_view/byId' + coachUtils.addKey(id));
        };

        self.creditsByName = function(name) {
            return request('GET', '_design/credits/_view/byName' + coachUtils.addKey(name));
        };

        self.updateHash = function(id, hash) {
            var deferred = q.defer();

            request('GET', id)
                .then(function (result) {
                    result.hash = hash;
                    request('PUT', id, result)
                        .then(function (result) {
                            deferred.resolve(result);
                        }, function (error) {
                            deferred.reject(error);
                        });
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        self.addCredit = function(id, credit) {
            var deferred = q.defer();

            request('GET', id)
                .then(function (result) {
                    result.credits.push(credit);
                    request('PUT', id, result)
                        .then(function (result) {
                            deferred.resolve(result);
                        }, function (error) {
                            deferred.reject(error);
                        });
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        function findCreditById(credits, creditId) {
            var result;
            for(var index = 0; index < credits.length; index++) {
                if (credits[index].id === creditId)
                    return credits[index];
            }
        }

        self.decreaseFreeCredit = function(id, creditId, retries) {
            var deferred = q.defer();

            var currentTry = isNaN(retries) ? 1 : retries + 1;
            request('GET', id)
                .then(function (result) {
                    var credit = findCreditById(result.credits, creditId);

                    log.debug('decreaseFreeCredit(id:' + id + ',creditId:' + creditId + ',currentTry:' + currentTry + ',credit:' + JSON.stringify(credit));

                    if (!credit || credit.free <= 0) {
                        deferred.reject(errors.noCredit());
                        return;
                    }

                    credit.free--;

                    request('PUT', id, result)
                        .then(function (result) {
                            deferred.resolve(result);
                        }, function (error) {
                            if (currentTry <= 10 && error.reason.indexOf('Document update conflict') > -1) {
                                self.decreaseFreeCredit(id, creditId, currentTry)
                                    .then(function (result) {
                                        deferred.resolve(result);
                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                            } else {
                                deferred.reject(error);
                            }
                        });
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        self.increaseFreeCredit = function(id, creditId, retries) {
            var deferred = q.defer();

            var currentTry = isNaN(retries) ? 1 : retries + 1;
            request('GET', id)
                .then(function (result) {
                    var credits = findCreditById(result.credits, creditId);
                    if (!credits) {
                        deferred.reject(errors.invalidCreditId());
                        return;
                    }

                    credits.free++;

                    request('PUT', id, result)
                        .then(function (result) {
                            deferred.resolve(result);
                        }, function (error) {
                            if (currentTry <= 10 && error.reason.indexOf('Document update conflict') > -1) {
                                self.decreaseFreeCredit(id, creditId, currentTry)
                                    .then(function (result) {
                                        deferred.resolve(result);
                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                            } else {
                                deferred.reject(error);
                            }
                        });
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        self.add = function(user) {
            return request('PUT', user._id, user);
        };
    }
})();