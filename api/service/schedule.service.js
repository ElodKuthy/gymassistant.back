(function () {
    'use strict';

    module.exports = ScheduleService;

    ScheduleService.$inject = ['plugins', 'trainingService', 'log', 'roles', 'errors', 'attendeesService', 'identityService'];
    function ScheduleService(plugins, trainingService, log, roles, errors, attendeesService, identityService) {
        var self = this;
        var moment = plugins.moment;
        var q = plugins.q;

        self.thisWeek = function(args) {
            var startDate = moment().startOf('isoWeek').format();
            var endDate = moment().startOf('isoWeek').add({ days: 7 }).format();

            return trainingService.findByDate(startDate, endDate, args.user);
        };

        self.today = function(args) {
            var startDate = moment().startOf('day').format();
            var endDate = moment().startOf('day').add({ days: 1 }).format();

            return trainingService.findByDate(startDate, endDate, args.user);
        };

        self.fetch = function(args) {

            return q(args)
                .then(identityService.checkLoggedIn)
                .then(function () { return trainingService.findByDate(args.startDate, args.endDate, args.user); });
        };

        function validateTraining(args) {

            if (roles.isAdmin(args.user.roles)) {
                return args;
            }

            if (moment().startOf('day').isAfter(args.training.date)) {
                throw errors.trainingEnded();
            }

            if ((['delete']).indexOf(args.purpose) > -1 && args.training.coach != args.user.name) {
                throw errors.cantModifyNotOwnTraining();
            }

            if ((['delete']).indexOf(args.purpose) > -1 && moment().add({ hours: 3 }).isAfter(args.training.date)) {
                throw errors.toLateToLeave();
            }

            if ((['delete']).indexOf(args.purpose) > -1 && args.training.status === 'cancel') {
                throw errors.trainingCanceled();
            }

            return args;
        }

        self.cancelTraining = function (args) {

            return q(args)
                .then(identityService.chechCoach)
                .then(findTraining)
                .then(checkTraining)
                .then(removeAttendees)
                .then(setTrainingStatusToCanceled)
                .then(resolveResult);

            function findTraining (args) {
                return trainingService.findByIdFull(args.id)
                    .then(function (training) {
                        args.training = training;
                        return args;
                    });
            }

            function checkTraining (args) {
                args.purpose = 'delete';
                return validateTraining(args);
            }

            function removeAttendees (args) {
                var promises = [];
                args.training.attendees.forEach(function (attendee) {
                    args.userName = attendee.name;
                    promises.push(attendeesService.removeFromTraining(args));
                });

                return q.all(promises).thenResolve(args);
            }

            function setTrainingStatusToCanceled (args) {
                return trainingService.cancel(args.id).thenResolve(args);
            }

            function resolveResult (args) {
                return args.training;
            }
        };
    }

})();