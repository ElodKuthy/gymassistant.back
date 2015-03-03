(function () {
    'use strict';

    module.exports = UsersService;

    UsersService.$inject = ['plugins', 'errors', 'identityService', 'users', 'roles'];
    function UsersService(plugins, errors, identityService, users, roles) {

        var self = this;
        var q = plugins.q;

        self.getUserByName = function(args) {

            return q(args)
                .then(identityService.checkCoach)
                .then(function (args) { return identityService.findByName(args.name); });
        };

        self.getAllUsers = function(args) {

            return q(args)
                .then(identityService.checkCoach)
                .then(users.byNameAll);
        };

        self.getAllCoaches = function(args) {

            return q(args)
                .then(identityService.checkAdmin)
                .then(self.getAllUsers)
                .then(filterForCoaches);

            function filterForCoaches(users) {

                var coaches = [];

                users.forEach(function (user) {
                    if (roles.isCoach(user)) {
                        coaches.push(user);
                    }
                });

                return coaches;
            }
        };
    }

})();