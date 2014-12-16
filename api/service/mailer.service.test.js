(function () {
    'use strict';
    /*jshint expr: true*/

    describe('Email sending service', function () {

        var container = require('../container.js')('test_config.json');
        var plugins = container.get('plugins');
        var expect = plugins.expect;
        var q = plugins.q;

        var refParams = {
            user: {
                name: 'Test User',
                email: 'Test.User@mail.com'
            },
            password: 'test123'
        };

        describe('new user email', function () {

            it ('should call the mailer with proper parameters', function (done) {
                var mailerMock = {
                    send: function (template, params, callback) {
                        expect(template).to.equal('emails/registration');
                        expect(params.to).to.equal(refParams.user.email);
                        expect(params.subject).to.equal('Testkultúra Terem - Üdvözölünk');
                        expect(params.userName).to.equal(refParams.user.name);
                        expect(params.password).to.equal(refParams.password);
                        callback(null, 'ok');
                    }
                };

                container.register('mailer', mailerMock);

                var mailerService = container.get('mailerService');

                mailerService.sendRegistrationMail(refParams)
                    .then(function (result) {
                        expect(result).to.equal('Az üdvözlő emailt sikeresen elküldük az új felhasználónak');
                    })
                    .nodeify(done);
            });
        });

        describe('reset password email', function () {

            it ('should call the mailer with proper parameters', function (done) {
                var mailerMock = {
                    send: function (template, params, callback) {
                        expect(template).to.equal('emails/reset_password');
                        expect(params.to).to.equal(refParams.user.email);
                        expect(params.subject).to.equal('Testkultúra Terem - Jelszó csere');
                        expect(params.userName).to.equal(refParams.user.name);
                        expect(params.password).to.equal(refParams.password);
                        callback(null, 'ok');
                    }
                };

                container.register('mailer', mailerMock);

                var mailerService = container.get('mailerService');

                mailerService.sendResetPasswordMail(refParams)
                    .then(function (result) {
                        expect(result).to.equal('Az új jelszót elküldtük a felhasználó email címére');
                    })
                    .nodeify(done);
            });
        });
    });

})();