(function () {
    'use strict';

    module.exports = SeriesService;

    SeriesService.$inject = ['plugins', 'errors', 'identityService', 'scheduleService', 'locationService', 'series', 'trainings'];

    function SeriesService(plugins, errors, identityService, scheduleService, locationService, series, trainings) {

        var self = this;
        var uuid = plugins.uuid;
        var q = plugins.q;
        var moment = plugins.moment;

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
            return q(args)
                .then(identityService.checkCoach)
                .then(function () {
                    return series.byDate()
                });
        }

        self.getAllOfCoach = function (args) {
            return q(args)
                .then(identityService.checkAdmin)
                .then(function () {
                    return series.byCoach(args.coach)
                });
        }

        self.get = function (args) {
            return q(args)
                .then(identityService.checkAdmin)
                .then(function () {
                    return series.get(args.id).catch(function (err) {
                        throw errors.invalidTrainingId(err);
                    });
                });
        }

        self.add = function (args) {

            return q(args)
                .then(identityService.checkAdmin)
                .then(check)
                .then(addAdditionalProperties)
                .then(addToDb);

            function check(args) {
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
                if (!args.location) {
                    throw errors.missingProperty('Új edzés', 'terem');
                }

                return args;
            }

            function addAdditionalProperties(args) {
                args._id = uuid.v4();
                args.status = self.statuses.normal;
                args.type = 'training series';
                delete args.user;
                return args;
            }

            function addToDb(args) {
                return series.add(args);
            }
        }

        self.set = function (args) {

            return q(args)
                .then(identityService.checkAdmin)
                .then(self.get)
                .then(updateName)
                .then(updateCoach)
                .then(updateMax)
                .then(updateDate)
                .then(updateStatus)
                .then(updateLocation);

            function updateName(instance) {

                if (args.name && args.name != instance.name) {
                    return series.updateName(instance._id, args.name);
                }

                return instance;
            }

            function updateCoach(instance) {

                if (args.coach && args.coach != instance.coach) {
                    return series.updateCoach(instance._id, args.coach);
                }

                return instance;
            }

            function updateMax(instance) {

                if (args.max && args.max != instance.max) {
                    return series.updateMax(instance._id, args.max);
                }

                return instance;
            }

            function updateDate(instance) {

                if (args.date) {
                    return series.updateDate(instance._id, args.date);
                }

                return instance;
            }

            function updateStatus(instance) {

                if (args.status && self.statuses.parse(args.status) && args.status != instance.status) {
                    return series.updateStatus(instance._id, args.status);
                }

                return instance;
            }

            function updateLocation(instance) {

                return locationService.findById(args.location).then(function (location) {

                    if (location) {
                        return series.updateLocation(instance._id, args.location);
                    }

                    return instance;
                });
            }
        };

        self.updateTrainings = function (args) {

            return q(args)
                .then(identityService.checkAdmin)
                .then(getSeries)
                .then(getTrainings)
                .then(saveTrainings)
                .thenResolve('Sikeres frissítetted az edzésalkalmakat');

            function getSeries(args) {
                var deferred = q.defer();

                if (!args.ids || !args.ids.length) {
                    series.byDate()
                        .then(function (series) {
                            deferred.resolve(series);
                        })
                        .catch(function (err) {
                            deferred.reject(errors.invalidTrainingId(err));
                        });
                } else {
                    var promises = [];

                    args.ids.forEach(function (id) {
                        promises.push(series.get(id));
                    });

                    q.all(promises)
                        .then(function (series) {
                            deferred.resolve(series);
                        })
                        .catch(function (err) {
                            deferred.reject(errors.invalidTrainingId(err));
                        });
                }

                return deferred.promise;
            }

            function getTrainings(series) {

                var promises = [];

                series.forEach(function (currentSeries) {

                    if (currentSeries.status === 'cancelled') {
                        throw errors.seriesCancelled();
                    }

                    var startDate = args.from.clone().startOf('isoWeek').add({
                        days: (currentSeries.date.day - 1),
                        hours: currentSeries.date.hour
                    });

                    if (startDate.isBefore(args.from)) {
                        startDate.add({
                            week: 1
                        });
                    }

                    for (var date = startDate; date.isBefore(args.to); date.add({
                            week: 1
                        })) {
                        promises.push(updateOrCreateTraining(currentSeries, date.unix()));
                    }
                });

                return q.all(promises);
            }

            function updateOrCreateTraining(series, date) {

                return trainings.bySeriesAndDate(series._id, date).then(function (results) {
                    var training = (results && results.length) ? results[0] : {
                        _id: uuid.v4(),
                        series: series._id,
                        date: date,
                        attendees: [],
                        type: 'training',
                        status: 'normal'
                    };

                    training.name = series.name;
                    training.coach = series.coach;
                    training.max = series.max;
                    training.location = series.location;

                    return training;
                });
            }

            function saveTrainings(instances) {

                var promises = [];

                instances.forEach(function (instance) {
                    promises.push(trainings.put(instance));
                });

                return q.allSettled(promises);
            }
        };

        self.deleteSeries = function (args) {

            return q(args)
                .then(identityService.checkAdmin)
                .then(getTrainings)
                .then(cancelTrainings)
                .then(cancelSeries)
                .thenResolve('Sikeres törölted az edzést');

            function getTrainings(args) {
                return trainings.bySeriesFromTo(args.id, moment().endOf('day').unix(), moment({
                        years: 3000
                    }).endOf('year').unix())
                    .then(function (trainings) {
                        args.trainings = trainings;
                        return args;
                    });
            }

            function cancelTrainings(args) {

                var promises = [];

                args.trainings.forEach(function (training) {
                    promises.push(scheduleService.cancelTraining({
                        user: args.user,
                        id: training._id
                    }));
                });

                return q.allSettled(promises).thenResolve(args);
            }

            function cancelSeries(args) {
                return series.updateStatus(args.id, self.statuses.cancelled).thenResolve(args);
            }
        }
    }

})();