(function () {
    "use strict";

    var jfs = require("jsonfile");

    var config = jfs.readFileSync(__dirname + "./../../config.json");

    exports.log = config.log;

})();

