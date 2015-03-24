(function () {
    'use strict';

    module.exports = Trainings;

    Trainings.$inject = ['plugins', 'coachUtils'];
    function Trainings(plugins, coachUtils) {
        var self = this;
        var get = coachUtils.get;
        var put = coachUtils.put;
        var q = plugins.q;
        var moment = plugins.moment;

        self.byId = function(id) {
            return get('_design/trainings/_view/byId' + coachUtils.addKey(id));
        };

        self.byDate = function(dates) {
            return get('_design/trainings/_view/byDate' + coachUtils.addDateKey(dates));
        };

        self.bySeriesTillOffset = function(series, start, offset) {
            var keys = '?startkey=["' + series + '",' + start.toString() + ']&endkey=["' + series + '",' + moment.unix(start).add({days: offset}).endOf('day').unix().toString() + ']';
            return get('_design/trainings/_view/bySeriesAndDate' + keys);
        };

        self.bySeriesAndDate = function(series, date) {
            var keys = '?key=["' + series + '",' + date.toString() + ']';
            return get('_design/trainings/_view/bySeriesAndDate' + keys);
        };

        self.bySeriesFromTo = function(series, from, to) {
            var keys = '?startkey=["' + series + '",' + from.toString() + ']&endkey=["' + series + '",' + to.toString() + ']';
            return get('_design/trainings/_view/bySeriesAndDate' + keys);
        };

        self.put = function (training) {
            return put(training._id, training);
        }

        self.updateCoach = function (id, coach) {

            function update (instance) {
                instance.coach = coach;
                return q(instance);
            }

            return coachUtils.updateDoc(id, update);
        };

        self.updateStatus = function (id, status) {

            function update (instance) {
                instance.status = status;
                return q(instance);
            }

            return coachUtils.updateDoc(id, update);
        };

        self.updateAttendees = function(id, attendees) {

            function update (instance) {
                instance.attendees = attendees;
                return q(instance);
            }

            return coachUtils.updateDoc(id, update);
        };
    }
})();