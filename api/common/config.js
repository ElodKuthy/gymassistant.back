(function () {
    'use strict';

    module.exports = Config;

    Config.$inject = ['plugins'];
    function Config(plugins) {
        var self = this;
        var config = plugins.jsonfile.readFileSync(__dirname + '/../../config.json');

        self.log = config.log;
        self.db = config.db;
    }

})();