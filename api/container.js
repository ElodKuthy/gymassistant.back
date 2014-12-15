(function () {
    'use strict';

    module.exports = function (configFileName) {

        var intravenous = require('intravenous');
        var container = intravenous.create();

        /* Globals */
        container.register('configFileName', configFileName);

        /* DB build scripts */
        container.register('buildViews', require('./build_db/build_views.js'));

        /* common components */
        container.register('coachUtils', require('./common/coach_utils.js'));
        container.register('config', require('./common/config.js'), 'singleton');
        container.register('errors', require('./common/errors.js'), 'singleton');
        container.register('log', require('./common/log.js'), 'singleton');
        container.register('plugins', require('./common/plugins.js'), 'singleton');

        /* data access layer */
        container.register('series', require('./dal/series.js'));
        container.register('trainings', require('./dal/trainings.js'));
        container.register('users', require('./dal/users.js'));

        /* service layer */
        container.register('attendees', require('./service/attendees.js'));
        container.register('credits', require('./service/credits.js'));
        container.register('identity', require('./service/identity.js'));
        container.register('periods', require('./service/periods.js'), 'singleton');
        container.register('roles', require('./service/roles.js'), 'singleton');
        container.register('scheduleService', require('./service/schedule.service.js'));
        container.register('subscription', require('./service/subscription.js'));
        container.register('trainingService', require('./service/training.service.js'));

        return container;
    };
})();
