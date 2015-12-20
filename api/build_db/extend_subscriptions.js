(function () {
    'use strict';

    var container = require('../container.js')('config.json');

    var plugins = container.get('plugins');
    var moment = plugins.moment;
    var q = plugins.q;
    var coachUtils = container.get('coachUtils');

    var usersDal = container.get('users');

    function checkCredit(user, index) {
        if (index < user.credits.length) {
            var expiry = moment.unix(user.credits[index].expiry);
            if (expiry.isAfter('2015-12-21T00:00:00+01:00')) {
                return usersDal.increaseExpiry(user._id, user.credits[index].id, 1209600).then(function () {
                    return checkCredit(user, index + 1);
                });
            }

            return checkCredit(user, index + 1);
        }

        return q('done');
    }

    function checkUser(users, index) {
        if (index < users.length) {
            return checkCredit(users[index], 0).then(checkUser(users, index + 1));
        }

        return q('done');
    }

    usersDal.byNameAll().then(function(users) {
        return checkUser(users, 0).then(function (result) { console.log(result) });
    });
})();