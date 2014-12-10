(function () {
    'use strict';

    module.exports = Schedule;

    Schedule.$inject = ['plugins', 'coachUtils', 'trainings', 'log', 'roles', 'errors'];
    function Schedule(plugins, coachUtils, trainings, log, roles, errors) {
        var self = this;
        var moment = plugins.moment;
        var q = plugins.q;
        var request = coachUtils.request;
        var addKey = coachUtils.addKey;

        self.isAttendee = function (training, user) {
            if (user && user.name) {
                for (var index = 0; index < training.attendees.length; index++) {
                    var current = training.attendees[index];
                        if (current.name.indexOf(user.name) > -1) {
                            return true;
                        }
                    }
            }
            return false;
        };

        self.isParticipant = function(training, user) {
            if (user && user.name) {
                for (var index = 0; index < training.attendees.length; index++) {
                    var current = training.attendees[index];
                        if (current.name.indexOf(user.name) > -1) {
                            return current.checkedIn;
                        }
                    }
            }
            return false;
        };

        function showAttendeesForAuthOnly(training, user) {
            if (user && user.name && (roles.isTheCoachOfTraining(user, training) || roles.isAdmin(user))) {
                return training.attendees;
            }
        }

        function convertTraining(training, user) {
            var result = {
                _id: training._id,
                _rev: training._rev,
                series: training._series,
                name: training.name,
                coach: training.coach,
                date: moment.unix(training.date),
                max: training.max,
                type: training.type,
                status: training.status,
                isAttendee: self.isAttendee(training, user),
                isParticipant: self.isParticipant(training, user),
                current: training.attendees.length,
                attendees: showAttendeesForAuthOnly(training, user),
            };

            return result;
        }

        self.thisWeek = function(user) {
            var startDate = moment().startOf('isoWeek').format();
            var endDate = moment().startOf('isoWeek').add({ days: 7 }).format();

            return self.fetch(startDate, endDate, user);
        };

        self.today = function(user) {
            var startDate = moment().startOf('day').format();
            var endDate = moment().startOf('day').add({ days: 1 }).format();

            return self.fetch(startDate, endDate, user);
        };

        self.fetch = function(startDate, endDate, user) {

            var deferred = q.defer();

            var result = {};

            result.dates = {
                begin: moment(startDate),
                end: moment(endDate)
            };

            result.schedule = [];

            trainings.byDate([startDate, endDate])
                .then(function (trainings) {
                    console.log(user);
                    var results = [];
                    trainings.forEach(function (training) {
                        results.push(convertTraining(training, user));
                    });

                    deferred.resolve(results);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        self.findByIdFull = function(id) {
            return self.findById(id, { name: 'internal', roles: [roles.admin] });
        };

        self.findById = function(id, user) {

            var deferred = q.defer();

            trainings.byId(id)
                .then(function (trainings) {
                    if (!trainings || trainings.length != 1) {
                        deferred.reject(errors.invalidTrainingId());
                    } else {
                        deferred.resolve(convertTraining(trainings[0], user));
                    }
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };
    }

})();