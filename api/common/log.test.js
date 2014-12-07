(function () {
    'use strict';
    /*jshint expr: true*/

    var should = require('should');
    var a = require('a');

    var container = require('../container.js');
    var log = container.get('log');

    describe('Logger', function () {

        it('should set log file based on config');
        it('should set exception log file based on config');
        it('should set console logging based on config');
        it('should log error');
        it('should log info');
        it('should log debug');
    });
})();