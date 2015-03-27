(function () {
    'use strict';

    module.exports = TrainingService;

    TrainingService.$inject = ['plugins', 'trainings', 'log', 'roles', 'errors', 'identityService', 'creditsService'];
    function TrainingService(plugins, trainings, log, roles, errors, identityService, creditsService) {
        var self = this;
        var moment = plugins.moment;
        var q = plugins.q;

        self.isAttendee = function (training, user) {
            if (user && user.name) {
                for (var index = 0; index < training.attendees.length; index++) {
                    var current = training.attendees[index];
                        if (current.name === user.name) {
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
            if (user && roles.isCoach(user)) {
                return training.attendees;
            }
        }

        function convertTraining(training, user) {
            var result = {
                _id: training._id,
                _rev: training._rev,
                series: training.series,
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

        self.findByDate = function(startDate, endDate, user) {

            var deferred = q.defer();

            var result = {};

            result.dates = {
                begin: moment(startDate),
                end: moment(endDate)
            };

            result.schedule = [];

            trainings.byDate([startDate, endDate])
                .then(function (trainings) {
                    var results = [];
                    trainings.forEach(function (training) {
                        if (training.status != 'cancel')
                            results.push(convertTraining(training, user));
                    });

                    deferred.resolve(results);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        self.findByIdFull = function(id) {
            return self.findById({ id: id, user: { name: 'internal', roles: [roles.coach, roles.admin] } });
        };

        self.findById = function(args) {

            return trainings.byId(args.id)
                .then(function (trainings) {
                    if (!trainings || trainings.length != 1) {
                        throw errors.invalidTrainingId();
                    }

                    return convertTraining(trainings[0], args.user);
                });

        };

        self.cancel = function (id) {
            return trainings.updateStatus(id, 'cancel');
        };

        self.changeCoach = function(args) {

            if (!args.id) {
                throw errors.missingProperty('Edzőváltás', 'Edzés azonosító');
            }

            if (!args.coach) {
                throw errors.missingProperty('Edzőváltás', 'Új edző');
            }

            return q(args)
                .then(identityService.checkCoach)
                .then(findTraining)
                .then(updateAttendees)
                .then(updateCoach);
        }

        function findTraining(args) {
            return self.findById(args)
                .then(function (training) {
                    args.training = training;
                    return args;
                });
        }

        function updateAttendees(args) {

            return updateAttendee(args, 0).then(function (args) { return trainings.updateAttendees(args.training._id, args.training.attendees).thenResolve(args); });
        }

        function updateAttendee(args, index) {

            if (index >= args.training.attendees.length) {
                return args;
            }

            var attendee = args.training.attendees[index];
            args.id = attendee.ref;
            args.userName =  attendee.name;

            return creditsService.getCredit(args).then(function (credit) {
                attendee.type = (credit.coach == args.coach) ? 'normal' : 'guest';
                return updateAttendee(args, index + 1);
            });
        }

        function updateCoach(args) {
            return trainings.updateCoach(args.training._id, args.coach).thenResolve(args.training);
        }
    }
})();