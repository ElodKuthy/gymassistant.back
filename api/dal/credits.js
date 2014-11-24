(function () {
    "use strict";

    exports.update = update;

    var moment = require("moment");
    var validator = require("validator");

    var errors = require("./../common/errors.js");
    var schedule = require("./schedule.js");
    var users = require("./users.js");

    function update(credits, userName, coach, expiry) {

            var creditsToAdd = NaN;

            if (validator.isInt(credits)) {
                creditsToAdd = parseInt(credits);
            }

            if (isNaN(creditsToAdd) || creditsToAdd < 1) {
                return errors.onlyPositiveIntegers();
            }

            var user = users.findByName(userName);

            if(!user) {
                return errors.unknownUserName();
            }

            user.updateCredits(credits, coach, expiry);

            users.commit();

            return user.credits;
    }
})();