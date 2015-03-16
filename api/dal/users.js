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

        self.byNameAll = function () {
            return request('GET', '_design/users/_view/byName');
        };

        self.byEmail = function (email) {
            return request('GET', '_design/users/_view/byEmail' + coachUtils.addKey(email));
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

        self.decreaseFreeCredit = function(id, creditId) {

            function update(user) {
                var deferred = q.defer();

                var credit = findCreditById(user.credits, creditId);

                if (credit && credit.free > 0) {
                    credit.free--;
                    deferred.resolve(user);
                } else {
                    deferred.reject(errors.noCredit());
                }

                return deferred.promise;
            }

            return coachUtils.updateDoc(id, update);
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
                                self.increaseFreeCredit(id, creditId, currentTry)
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

        self.increaseExpiry = function(id, creditId, inc) {

            function update (instance) {
                var credit = findCreditById(instance.credits, creditId);
                if (!credit) {
                    throw errors.invalidCreditId();
                }
                credit.expiry += inc;
                return q(instance);
            }

            return coachUtils.updateDoc(id, update);
        };

        self.add = function(user) {
            return request('PUT', user._id, user);
        };

        self.updateEmail = function(id, email) {

            function update (instance) {
                instance.email = email;
                return q(instance);
            }

            return coachUtils.updateDoc(id, update);
        };

        self.updatePreferences = function(id, preferences) {

            function update(instance) {
                instance.preferences = preferences;
                return q(instance);
            }

            return coachUtils.updateDoc(id, update);
        }
    }
})();