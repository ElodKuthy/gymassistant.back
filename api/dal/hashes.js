(function () {
    "use strict";

    exports.checkHash = checkHash;
    exports.setHash = setHash;
    exports.createHash = createHash;

    var crypto = require("crypto");
    var jfs = require("jsonfile");

    var errors = require("./../common/errors.js");

    var hashes = jfs.readFileSync(__dirname + "./../data/hashes.json").hashes;

    function checkHash(user, hash) {
        for (var index = 0; user && index < hashes.length; index++){
            var current = hashes[index];
            if (current.userName === user.userName && current.hash === hash) {
                return true;
            }
        }
        return false;
    }

    function setHash(user, password) {

        var hash = createHash(password);

        for (var index = 0; user && index < hashes.length; index++){
            var current = hashes[index];
            if (current.userName === user.userName) {
                current.hash = hash;
                saveHashes();
                return "A jelszó sikeresen meg lett változtatva";
            }
        }

        return error.passwordChangeFailed();
    }

    function createHash(password) {
            var sha512 = crypto.createHash("sha512");
            sha512.update(password, "utf8");
            var hash = sha512.digest(password);
            return hash.toString("base64");
    }

    function saveHashes() {
        var data = {};
        data.hashes = hashes;
        jfs.writeFileSync(__dirname + "./../data/hashes.json", data);
    }


})();