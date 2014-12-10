(function () {
    'use strict';

    var container = require('../container.js');

    module.exports = Plugins;

    function Plugins () {
        var self = this;

        self.jsonfile = require('jsonfile');
        self.winston = require('winston');
        self.request = require('request');
        self.uuid = require('node-uuid');
        self.q = require('q');
        self.moment = require('moment');
        self.crypto = require('crypto');
        self.generatePassword = require('password-generator');
        self.validator = require('validator');
    }

})();
