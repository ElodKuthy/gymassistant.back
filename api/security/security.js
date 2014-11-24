(function () {
    "use strict";

    exports.authenticate = authenticate;
    exports.checkLoggedIn = checkLoggedIn;
    exports.checkCoach = checkCoach;
    exports.checkAdmin = checkAdmin;

    var logger = require("./../common/log.js");
    var errors = require("./../common/errors.js");
    var users = require("./../dal/users.js");
    var hashes = require("./../dal/hashes.js");

    function authenticate(req) {

        req.user = null;

        var authorizationHeader = req.headers.authorization;

        if (!authorizationHeader) {
            logger.info("Anonymus request");
            return;
        }

        try {

            var base64 = authorizationHeader.replace("Basic ", "");
            base64 = new Buffer(base64, "base64");
            var userNameAndPassword = base64.toString("utf8");
            logger.debug(userNameAndPassword);
            userNameAndPassword = userNameAndPassword.split(":");
            var userName = userNameAndPassword[0];
            var password = userNameAndPassword[1];
            var hashBase64 = hashes.createHash(password);

            var user = users.findByNameOrEmail(userName);

            if (hashes.checkHash(user, hashBase64)) {
                req.user = user;
                logger.info("Authenticated as " + user.userName);
            }

        } catch (error) {
            logger.error(error.stack);
            req.user = null;
        }
    }

    function checkLoggedIn(req, res) {
        if (!req.user) {
            errors.unauthorized(res);
            return false;
        }

        return true;
    }

    function checkCoach(req, res) {
        if (!req.user) {
            res.json(errors.invalidUserNameOrPassword);
            return false;
        }

        if (!req.user.isCoach()) {
            res.json(errors.unauthorized());
            return false;
        }

        return true;
    }

    function checkAdmin(req, res) {
        if (!req.user) {
            res.json(errors.invalidUserNameOrPassword());
            return false;
        }

        if (!req.user.isAdmin()) {
            res.json(errors.unauthorized());
            return false;
        }

        return true;
    }
})();