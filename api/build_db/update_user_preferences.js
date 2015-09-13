(function () {
    'use strict';
    module.exports = UserPreferencesUpdater;

    UserPreferencesUpdater.$inject = ['plugins', 'coachUtils'];

    function UserPreferencesUpdater(plugins, coachUtils) {

        var self = this;
        var q = plugins.q;
        var uuid = plugins.uuid;

        self.update = function () {
            return coachUtils.get('_design/users/_view/byNameFull').then(function (results) {
                return checkNextUser({
                    users: results,
                    index: 0
                });
            });
        }

        function checkNextUser(args) {
            if (args.index < args.users.length) {
                return checkNextUser({
                        users: args.users,
                        index: args.index + 1
                    })
                    .then(function () {
                        if (checkPreferences(args)) {
                            return coachUtils.put(args.users[args.index]._id, args.users[args.index]).then(function (results) {
                                return args;
                            });
                        }
                    });
            }

            return q(args);
        }

        function checkPreferences(args) {

            var preferences = args.users[args.index].preferences ? args.users[args.index].preferences : {};
            var modified = false;

            if (typeof preferences.id === "undefined") {
                preferences.id = uuid.v4();
                modified = true;
            }

            if (typeof preferences.askIrreversibleJoining === "undefined") {
                preferences.askIrreversibleJoining = true;
                modified = true;
            }

            if (typeof preferences.expirationNotification === "undefined") {
                preferences.expirationNotification = true;
                modified = true;
            }

            if (typeof preferences.newsletter === "undefined") {
                preferences.newsletter = true;
                modified = true;
            }

            args.users[args.index].preferences = preferences;

            return modified;
        }
    }

})();