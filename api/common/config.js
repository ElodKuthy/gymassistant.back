(function () {
    "use strict";

    var jfs = require("jsonfile");

    var config = jfs.readFileSync(__dirname + "./../../config.json");

    module.exports = {
        log: config.log,
        db: config.db
    };
})();