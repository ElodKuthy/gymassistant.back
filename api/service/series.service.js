(function () {
    'use strict';

    module.exports = SeriesService;

    SeriesService.$inject = ['init', 'plugins', 'errors', 'identityService', 'series'];
    function SeriesService(init, plugins, errors, identityService, series) {

        var self = this;

        var q = plugins.q;

        var _user = init.user;
        var _id = init.id;

        function getInstance () {
            return series.get(_id).catch(function (err) {
                throw errors.invalidTrainingId(err);
            });
        }

        self.statuses = {
            normal: 'normal',
            cancelled: 'cancelled',
            parse: function (value) {
                if (value == self.statuses.normal)
                    return self.statuses.normal;
                if (value == self.statuses.cancelled)
                    return self.statuses.cancelled;
            }
        };

        self.set = function (args) {

            return identityService.checkAdmin(_user)
                .then(getInstance)
                .then(updateName)
                .then(updateCoach)
                .then(updateMax)
                .then(updateDates)
                .then(updateStatus);

            function updateName (instance) {

                if (args.name && args.name != instance.name) {
                    return series.updateName(instance._id, args.name);
                }

                return instance;
            }

            function updateCoach (instance) {

                if (args.coach && args.coach != instance.coach) {
                    return series.updateCoach(instance._id, args.coach);
                }

                return instance;
            }

            function updateMax (instance) {

                if (args.max && args.max != instance.max) {
                    return series.updateMax(instance._id, args.max);
                }

                return instance;
            }

            function updateDate (instance) {

                if (args.date) {
                    return series.updateDate(instance._id, args.date);
                }

                return instance;
            }
            function updateStatus (instance) {

                if (args.status && self.statuses.parse(args.status) && args.status != instance.status) {
                    return series.updateStatus(instance._id, args.status);
                }

                return instance;
            }
        };
    }

})();