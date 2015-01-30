(function () {
    'use strict';

    module.exports = UsersService;

    UsersService.$inject = ['init', 'plugins', 'errors', 'identityService', 'users', 'roles'];
    function UsersService(init, plugins, errors, identityService, users, roles) {

        var self = this;

        var q = plugins.q;

        var _user = init.user;

        self.getAllUsers = function () {

            return identityService.checkCoach2(_user)
                .then(users.byNameAll);
        };

        self.getAllCoaches = function () {

            return identityService.checkAdmin(_user)
                .then(self.getAllUsers)
                .then(filterForCoaches);

            function filterForCoaches (users) {

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