(function () {
    'use strict';

    module.exports = ScheduleService;

    ScheduleService.$inject = ['plugins', 'trainingService', 'log', 'roles', 'errors', 'attendees'];
    function ScheduleService(plugins, trainingService, log, roles, errors, attendees) {
        var self = this;
        var moment = plugins.moment;
        var q = plugins.q;

        self.thisWeek = function(user) {
            var startDate = moment().startOf('isoWeek').format();
            var endDate = moment().startOf('isoWeek').add({ days: 7 }).format();

            return trainingService.findByDate(startDate, endDate, user);
        };

        self.today = function(user) {
            var startDate = moment().startOf('day').format();
            var endDate = moment().startOf('day').add({ days: 1 }).format();

            return trainingService.findByDate(startDate, endDate, user);
        };

        self.fetch = function(startDate, endDate, user) {

            return trainingService.findByDate(startDate, endDate, user);
        };

        function validateTraining(training, purpose, coach) {

            if (moment().subtract({ hours: 1 }).isAfter(training.date)) {
                throw errors.trainingEnded();
            }

            if ((['delete']).indexOf(purpose) > -1 && training.coach != coach.name) {
                throw errors.cantModifyNotOwnTraining();
            }

            if ((['delete']).indexOf(purpose) > -1 && moment().add({ hours: 3 }).isAfter(training.date)) {
                throw errors.toLateToLeave();
            }

            if ((['delete']).indexOf(purpose) > -1 && training.status === 'cancel') {
                throw errors.trainingCanceled();
            }
        }

        self.cancelTraining = function (id, coach) {

            return trainingService.findByIdFull(id)
                .then(checkTraining)
                .then(removeAttendees)
                .then(setTrainingStatusToCanceled)
                .then(resolveResult);

            function checkTraining (training) {
                validateTraining(training, 'delete', coach);
                return training;
            }

            function removeAttendees (training) {
                var promises = [];
                training.attendees.forEach(function (attendee) {
                    promises.push(attendees.removeFromTraining(id, attendee.name, coach));
                });

                return q.all(promises);
            }

            function setTrainingStatusToCanceled () {
                return trainingService.cancel(id);
            }

            function resolveResult () {
                return 'A edzést sikeresen töröltük';
            }
        };
    }

})();