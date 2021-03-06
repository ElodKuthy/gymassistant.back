(function () {
    'use strict';

    module.exports = function (configFileName) {

        var intravenous = require('intravenous');
        var container = intravenous.create();

        /* Globals */
        container.register('configFileName', configFileName);

        /* DB build scripts */
        container.register('designDocumentsUpdater', require('./build_db/update_design_documents.js'));
        container.register('userPreferencesUpdater', require('./build_db/update_user_preferences.js'));

        /* common components */
        container.register('coachUtils', require('./common/coach_utils.js'));
        container.register('config', require('./common/config.js'), 'singleton');
        container.register('errors', require('./common/errors.js'), 'singleton');
        container.register('log', require('./common/log.js'), 'singleton');
        container.register('plugins', require('./common/plugins.js'), 'singleton');

        /* data access layer */
        container.register('locations', require('./dal/locations.js'));
        container.register('series', require('./dal/series.js'));
        container.register('trainings', require('./dal/trainings.js'));
        container.register('users', require('./dal/users.js'));

        /* service layer */
        container.register('attendeesService', require('./service/attendees.service.js'));
        container.register('creditsService', require('./service/credits.service.js'));
        container.register('identityService', require('./service/identity.service.js'));
        container.register('locationService', require('./service/location.service.js'));
        container.register('mailerService', require('./service/mailer.service.js'));
        container.register('multipliers', require('./service/multipliers.js'), 'singleton');
        container.register('newsletterService', require('./service/newsletter.service.js'));
        container.register('periods', require('./service/periods.js'), 'singleton');
        container.register('roles', require('./service/roles.js'), 'singleton');
        container.register('scheduleService', require('./service/schedule.service.js'));
        container.register('subscriptionService', require('./service/subscription.service.js'));
        container.register('trainingService', require('./service/training.service.js'));
        container.register('seriesService', require('./service/series.service.js'));
        container.register('statsService', require('./service/stats.service.js'));
        container.register('usersService', require('./service/users.service.js'));

        /* tasks */
        container.register('taskRunner', require('./task/task.runner.js'));
        container.register('hourlyCheckTask', require('./task/hourly.check.task.js'));
        container.register('dailyCheckTask', require('./task/daily.check.task.js'));
        container.register('weeklyCheckTask', require('./task/weekly.check.task.js'));
        container.register('monthlyCheckTask', require('./task/monthly.check.task.js'));

        /* api */
        container.register('api', require('./api.js'));

        return container;
    };
})();