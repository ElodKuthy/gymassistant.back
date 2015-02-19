(function () {
    'use strict';

    module.exports = Attendees;

    Attendees.$inject = ['plugins', 'errors', 'trainingService', 'creditsService', 'log', 'users', 'trainings', 'roles', 'identityService'];
    function Attendees(plugins, errors, trainingService, creditsService, log, users, trainings, roles, identityService) {
        var self = this;
        var q = plugins.q;
        var moment = plugins.moment;

        function validateTraining(training, user, purpose, coach, adminMode) {

            if (!adminMode && moment().subtract({ hours: 1 }).isAfter(training.date)) {
                return errors.trainingEnded();
            }

            if (training.status === 'cancel') {
                return errors.trainingCanceled();
            }

            if ((['join', 'add']).indexOf(purpose) > -1 && training.current === training.max) {
                return errors.trainingFull();
            }

            if ((['check in']).indexOf(purpose) > -1 && moment().add({ hours: 2 }).isBefore(training.date)) {
                return errors.tooEarlyToCheckIn();
            }

            if ((['join', 'add']).indexOf(purpose) > -1 && trainingService.isAttendee(training, user)) {
                return errors.alreadySignedUp();
            }

            if ((['join', 'add', 'check in']).indexOf(purpose) > -1 && training.coach === user.name) {
                return errors.selfAttend();
            }

            if ((['remove', 'check in', 'check out']).indexOf(purpose) > -1 && !adminMode && training.coach != coach.name) {
                return errors.cantModifyNotOwnTraining();
            }

            if ((['leave', 'remove', 'check in']).indexOf(purpose) > -1 && !trainingService.isAttendee(training, user)) {
                return errors.notSignedUp();
            }

            if ((['check in']).indexOf(purpose) > -1 && training.attendees[findAttendee(training.attendees, user.name)].checkedIn) {
                return errors.alreadyCheckedIn();
            }

            if ((['undo check in']).indexOf(purpose) > -1 && !training.attendees[findAttendee(training.attendees, user.name)].checkedIn) {
                return errors.notCheckedIn();
            }

            if (!adminMode && (['leave', 'remove']).indexOf(purpose) > -1 && moment().add({ hours: 3 }).isAfter(training.date)) {
                return errors.toLateToLeave();
            }

        }

        function addCoach(user, training) {
            var deferred = q.defer();
            training.attendees.push({
                name: user.name,
                type: 'coach',
                checkedIn: false
            });

            trainings.updateAttendees(training._id, training.attendees)
                .then(function () {
                    deferred.resolve({ result: 'Sikeres jelentkezés'});
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function addClient(user, training, adminMode) {
            var deferred = q.defer();

            creditsService.bookFreeCredit(user, training, adminMode)
                .then(function(bookedCredit) {

                    training.attendees.push({
                        name: user.name,
                        type: bookedCredit.coach === training.coach ? 'normal' : 'guest',
                        ref: bookedCredit.id,
                        checkedIn: false
                    });

                    trainings.updateAttendees(training._id, training.attendees)
                        .then(function () {
                            deferred.resolve({ result: 'Sikeres jelentkezés'});
                        }, function (error) {
                            users.increaseFreeCredit(user._id, bookedCredit.id);
                            deferred.reject(error);
                        });
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }

        function add(user, training, adminMode) {
            return roles.isCoach(user) ? addCoach(user, training, adminMode) : addClient(user, training, adminMode);
        }

        self.addToTraining = function(id, userName, coach, adminMode) {
            var deferred = q.defer();

            q.all([identityService.findByName(userName), trainingService.findByIdFull(id)])
                .then(function (results) {
                    var user = results[0];
                    var training = results[1];

                    var error = validateTraining(training, user, 'add', coach, (coach.roles.indexOf('admin') > -1) || adminMode);

                    if (error) {
                        log.debug(error);
                        deferred.reject(error);
                        return;
                    }

                    add(user, training, (coach.roles.indexOf('admin') > -1) || adminMode)
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

        self.joinTraining = function(id, user) {
            var deferred = q.defer();

            trainingService.findByIdFull(id)
                .then(function (training) {

                    var error = validateTraining(training, user, 'join');

                    if (error) {
                        deferred.reject(error);
                        return;
                    }

                    add(user, training)
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

        function findCredits(credits, id) {
            for (var index = 0; index < credits.length; index++) {
                if (credits[index].id === id) {
                    return index;
                }
            }
            return -1;
        }

        function findAttendee(attendees, name) {
            for (var index = 0; index < attendees.length; index++) {
                if (attendees[index].name === name) {
                    return index;
                }
            }
            return -1;
        }

        function removeCoach(user, training) {
            var deferred = q.defer();

            training.attendees.splice(findAttendee(training.attendees, user.name), 1);

            trainings.updateAttendees(training._id, training.attendees)
                .then(function () {
                    deferred.resolve({ result: 'Sikeres lemondás'});
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function removeClient(user, training) {
            var deferred = q.defer();

            var attendeeToRemoveIndex = findAttendee(training.attendees, user.name);
            var creditToAddId = training.attendees[attendeeToRemoveIndex].ref;
            training.attendees.splice(attendeeToRemoveIndex, 1);

            trainings.updateAttendees(training._id, training.attendees)
                .then(function() {

                    users.increaseFreeCredit(user._id, creditToAddId)
                        .then(function () {
                            deferred.resolve({ result: 'Sikeres lemondás'});
                        }, function (error) {
                            deferred.reject(error);
                        });
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }

        function remove(user, training) {
            return roles.isCoach(user) ? removeCoach(user, training) : removeClient(user, training);
        }

        self.leaveTraining = function(id, user) {
            var deferred = q.defer();

            trainingService.findByIdFull(id)
                .then(function (training) {

                    var error = validateTraining(training, user, 'leave');

                    if (error) {
                        deferred.reject(error);
                        return;
                    }

                    remove(user, training)
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

        self.removeFromTraining = function(id, userName, coach) {
            var deferred = q.defer();

            q.all([identityService.findByName(userName, true), trainingService.findByIdFull(id)])
                .then(function (results) {
                    var user = results[0];
                    var training = results[1];

                    var error = validateTraining(training, user, 'remove', coach, coach.roles.indexOf('admin') > -1);

                    if (error) {
                        deferred.reject(error);
                        return;
                    }

                    remove(user, training)
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

        self.checkIn = function(id, userName, coach) {
            var deferred = q.defer();

            q.all([identityService.findByName(userName, true), trainingService.findByIdFull(id)])
                .then(function (results) {
                    var user = results[0];
                    var training = results[1];

                    var error = validateTraining(training, user, 'check in', coach, coach.roles.indexOf('admin') > -1);

                    if (error) {
                        deferred.reject(error);
                        return;
                    }

                    training.attendees[findAttendee(training.attendees, user.name)].checkedIn = true;

                    trainings.updateAttendees(training._id, training.attendees)
                        .then(function () {
                            deferred.resolve({ result: 'Sikeres bejelentkezés'});
                        }, function (error) {
                            deferred.reject(error);
                        });
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        self.undoCheckIn = function(id, userName, coach) {
            var deferred = q.defer();

            q.all([identityService.findByName(userName, true), trainingService.findByIdFull(id)])
                .then(function (results) {
                    var user = results[0];
                    var training = results[1];

                    var error = validateTraining(training, user, 'undo check in', coach, coach.roles.indexOf('admin') > -1);

                    if (error) {
                        deferred.reject(error);
                        return;
                    }

                    training.attendees[findAttendee(training.attendees, user.name)].checkedIn = false;

                    trainings.updateAttendees(training._id, training.attendees)
                        .then(function () {
                            deferred.resolve({ result: 'Bejelentkezés sikeresen visszavonva'});
                        }, function (error) {
                            deferred.reject(error);
                        });
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };
    }
})();