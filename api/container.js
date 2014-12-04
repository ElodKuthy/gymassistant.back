(function () {
    'use strict';

    var intravenous = require('intravenous');
    var container = intravenous.create();

    module.exports = container;


    /* common components */
    container.register('coachUtils', require('./common/coach_utils.js'));
    container.register('config', require('./common/config.js'), 'singleton');
    container.register('errors', require('./common/errors.js'), 'singleton');
    container.register('log', require('./common/log.js'), 'singleton');
    container.register('plugins', require('./common/plugins.js'), 'singleton');

    /* data access layer */
    container.register('trainings', require('./dal/trainings.js'));
    container.register('users', require('./dal/users.js'));

    /* service layer */
    container.register('attendees', require('./service/attendees.js'));
    container.register('credits', require('./service/credits.js'));
    container.register('identity', require('./service/identity.js'));
    container.register('periods', require('./service/periods.js'), 'singleton');
    container.register('roles', require('./service/roles.js'), 'singleton');
    container.register('schedule', require('./service/schedule.js'));
    container.register('subscription', require('./service/subscription.js'));
})();
