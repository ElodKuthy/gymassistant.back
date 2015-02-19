(function () {
    'use strict';

    module.exports = Series;

    Series.$inject = ['plugins', 'coachUtils'];
    function Series(plugins, coachUtils) {
        var self = this;
        var get = coachUtils.get;
        var put = coachUtils.put;
        var q = plugins.q;
        var moment = plugins.moment;

        self.byCoach = function (coachName) {
            return get('_design/series/_view/byCoach' + coachUtils.addKey(coachName));
        };

        self.byDate = function (date) {
            return get('_design/series/_view/byDate' + coachUtils.addKey(date));
        };

        self.get = function (id) {
            return get(id);
        };

        self.add = function(series) {
            return put(series._id, series);
        };

        self.updateName = function (id, name) {

            function update (instance) {
                instance.name = name;
                return q(instance);
            }

            return coachUtils.updateDoc(id, update);
        };

        self.updateCoach = function (id, coach) {

            function update (instance) {
                instance.coach = coach;
                return q(instance);
            }

            return coachUtils.updateDoc(id, update);
        };

        self.updateMax = function (id, max) {

            function update (instance) {
                instance.max = max;
                return q(instance);
            }

            return coachUtils.updateDoc(id, update);
        };

        self.updateDate = function (id, date) {

            function update (instance) {
                instance.date = date;
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
    }
})();