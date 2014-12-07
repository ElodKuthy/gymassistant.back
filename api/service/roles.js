(function () {
    'use strict';

    module.exports = Roles;

    function Roles () {
        var self = this;

        self.client = 'client';
        self.coach = 'coach';
        self.admin = 'admin';

        self.isCoach = function(user) {
            return user && user.roles && user.roles.indexOf(self.coach) > -1;
        };

        self.isTheCoachOfTraining = function(user, training) {
            return user && user.roles && user.roles.indexOf(self.coach) > -1 && training && user.name === training.coach;
        };

        self.isAdmin = function(user) {
            return user && user.roles && user.roles.indexOf(self.admin) > -1;
        };
    }

})();