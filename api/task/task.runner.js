(function () {
    'use strict';

    module.exports = TaskRunner;

    TaskRunner.$inject = ['expirationCheckTask'];

    function TaskRunner(expirationCheckTask) {
        var self = this;

        self.initAllScheduledTasks = function () {

            expirationCheckTask.init();
        }
    }

})();