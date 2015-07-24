(function () {
    'use strict';

    module.exports = TaskRunner;

    TaskRunner.$inject = ['hourlyCheckTask', 'dailyCheckTask', 'weeklyCheckTask', 'monthlyCheckTask'];

    function TaskRunner(hourlyCheckTask, dailyCheckTask, weeklyCheckTask, monthlyCheckTask) {
        var self = this;

        self.initAllScheduledTasks = function () {

            hourlyCheckTask.init();
            dailyCheckTask.init();
            weeklyCheckTask.init();
            monthlyCheckTask.init();
        }
    }

})();