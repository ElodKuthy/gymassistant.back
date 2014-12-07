(function () {
    'use strict';

    module.exports = Series;

    Series.$inject = ['plugins', 'coachUtils'];
    function Series(plugins, coachUtils) {
        var self = this;
        var request = coachUtils.request;
        var q = plugins.q;
        var moment = plugins.moment;

        self.byCoach = function(coachName) {
            return request('GET', '_design/series/_view/byCoach' + coachUtils.addKey(coachName));
        };
    }
})();