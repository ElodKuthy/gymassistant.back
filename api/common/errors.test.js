(function () {
    'use strict';
    /*jshint expr: true*/

    var should = require('should');
    var a = require('a');

    describe('Errors', function () {

        var stubLog = {};
        stubLog.error = a.mock();
        var Errors = require('./errors.js');
        var errors = new Errors(stubLog);
        var error;

        describe('Invalid user name or password', function() {

            var expected = 'Hibás felhasználónév vagy jelszó';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.invalidUserNameOrPassword();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('Unauthorized', function() {

            var expected = 'Ehhez a művelethez nincs jogosultsága';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.unauthorized();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('Invalid training ID', function() {

            var expected = 'Hibás edzés azonosító';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.invalidTrainingId();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('Training has been ended', function() {

            var expected = 'Ez az óra már véget ért';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.trainingEnded();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('Training is full', function() {

            var expected = 'Ez az edzés már megtelt';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.trainingFull();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('Unknown user name', function() {

            var expected = 'Nincs ilyen nevű felhasználó';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.unknownUserName();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('User already signed up for training', function() {

            var expected = 'A felhasználó már feliratkozott';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.alreadySignedUp();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('Trainer can`t sign up for his/her own training', function() {

            var expected = 'Saját órára nem lehet feliratkozni';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.selfAttend();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('User hasn`t got any free credit', function() {

            var expected = 'A felhasználónak nincs több szabad kreditje';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.noCredit();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('User hasn`t signed up for that training', function() {

            var expected = 'A felhasználó nem iratkozott fel erre az órára';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.notSignedUp();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('User already signed up for that training', function() {

            var expected = 'A felhasználó már bejelentkezett erre az órára';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.alreadyCheckedIn();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('User did not check in for that training', function() {

            var expected = 'A felhasználó nem jelentkezett be erre az órára';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.notCheckedIn();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('I is to late to leave the training', function() {

            var expected = 'Erről az óráról már túl késő leiratkozni';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.toLateToLeave();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('Only positive integers could be added to credits', function() {

            var expected = 'A kreditekhez csak pozitív egész szám adható';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.onlyPositiveIntegers();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

        describe('Password change has been failed', function() {

            var expected = 'Nem sikerült megváltoztatni a jelszót';

            before(function() {
                stubLog.error.expect(expected);
                error = errors.passwordChangeFailed();
            });
            it('should log error', function () {
                stubLog.error.verify().should.be.ok;
            });
            it('should return error message', function () {
                error.message.should.be.equal(expected);
            });
        });

    });
})();