(function () {
    'use strict';

    module.exports = SeriesService;

    SeriesService.$inject = ['plugins', 'errors', 'identityService', 'series'];
    function SeriesService(plugins, errors, identityService, series) {

        var self = this;
        var uuid = plugins.uuid;

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

        self.getAll = function (args) {
            return identityService.checkAdmin(args.user)
                .then(function () { return series.byDate() });
        }

        self.getAllOfCoach = function (args) {
            return identityService.checkAdmin(args.user)
                .then(function () { return series.byCoach(args.coach) });
        }

        self.get = function (args) {
            return identityService.checkAdmin(args.user)
                .then(function () {
                    return series.get(args.id).catch(function (err) {
                        throw errors.invalidTrainingId(err);
                    });
                });
        }


        self.add = function (args) {

            return identityService.checkAdmin(args.user)
                .then(check)
                .then(addAdditionalProperties)
                .then(addToDb);

                function check() {
                    if (!args.name) {
                        throw errors.missingProperty('Új edzés', 'név');
                    }
                    if (!args.coach) {
                        throw errors.missingProperty('Új edzés', 'edző');
                    }
                    if (!args.max) {
                        throw errors.missingProperty('Új edzés', 'maximális létszám');
                    }
                    if (!args.date) {
                        throw errors.missingProperty('Új edzés', 'dátum');
                    }
                }

                function addAdditionalProperties () {
                    args._id = uuid.v4();
                    args.status = self.statuses.normal;
                    args.type = 'training series';
                }

                function addToDb() {
                    return series.add(args);
                }
        }

        self.set = function (args) {

            return identityService.checkAdmin(args.user)
                .then(function () { return self.get(args); })
                .then(updateName)
                .then(updateCoach)
                .then(updateMax)
                .then(updateDate)
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