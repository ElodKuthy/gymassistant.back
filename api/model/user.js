(function () {
    "use strict";

    exports.ctor = User;

    var moment = require("moment");

    var errors = require("./../common/errors.js");
    var roles = require("./../dal/roles.js");

    function User(user) {
      this.userName = user.userName;
      this.email = user.email;
      this.roles = user.roles.slice();
      this.credits = user.credits;
    }

    User.prototype.isCoach = function () {
        return (this.roles && this.roles.indexOf(roles.coach) > -1);
    };

    User.prototype.isAdmin = function () {
        return (this.roles && this.roles.indexOf(roles.admin) > -1);
    };

    User.prototype.removeCredits = function (number) {
        if (this.isCoach() || this.isAdmin())
            return;

        if (this.credits.free === 0) {
            return errors.noCredit();
        }

        this.credits.free = this.credits.free - (number ? number : 1);
    };

    User.prototype.addCredits = function (number) {
        if (this.isCoach() || this.isAdmin())
            return;

        this.credits.free = this.credits.free + (number ? number : 1);
    };

    User.prototype.updateCredits = function (number, coach, expiry) {
        if (this.isCoach() || this.isAdmin())
            return;

        this.credits.free += number;
        this.credits.coach = coach;
        this.credits.expiry = moment().endOf("day").add(expiry);
    };
})();