(function () {
    'use strict';

    module.exports = Config;

    Config.$inject = ['plugins', 'configFileName'];
    function Config(plugins, configFileName) {
        var self = this;
        var config = plugins.jsonfile.readFileSync(__dirname + '/../../' + configFileName);

        self.log = config.log;
        self.db = config.db;
        self.server = config.server;
        self.email = config.email;
    }

})();