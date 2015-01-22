(function () {
    'use strict';

    module.exports = Trainings;

    Trainings.$inject = ['plugins', 'coachUtils'];
    function Trainings(plugins, coachUtils) {
        var self = this;
        var request = coachUtils.request;
        var q = plugins.q;
        var moment = plugins.moment;

        self.byId = function(id) {
            return request('GET', '_design/trainings/_view/byId' + coachUtils.addKey(id));
        };

        self.byDate = function(dates) {
            return request('GET', '_design/trainings/_view/byDate' + coachUtils.addDateKey(dates));
        };

        self.todayByCoach = function(coachName) {
            var keys = '?startkey=["' + coachName + '",' + moment().unix().toString() + ']&endkey=["' + coachName + '",' + moment().endOf('day').unix().toString() + ']';
            return request('GET', '_design/trainings/_view/byCoachAndDate' + keys);
        };

        self.bySeriesTillOffset = function(series, start, offset) {
            var keys = '?startkey=["' + series + '",' + start.toString() + ']&endkey=["' + series + '",' + moment().add({days: offset}).endOf('day').unix().toString() + ']';
            return request('GET', '_design/trainings/_view/bySeriesAndDate' + keys);
        };

        self.updateStatus = function (id, status) {

            function update (training) {
                var deferred = q.defer();
                try {
                    training.status = status;
                    deferred.resolve(training);
                } catch (err) {
                    deferred.reject(err);
                }

                return deferred.promise;
            }

            return coachUtils.updateDoc(id, update);
        };

        self.updateAttendees = function(id, attendees) {
            var deferred = q.defer();

            request('GET', id)
                .then(function (result) {
                    result.attendees = attendees;
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
    }
})();