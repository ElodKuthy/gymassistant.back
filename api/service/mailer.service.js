(function () {
    'use strict';

    module.exports = MailerService;

    MailerService.$inject = ['plugins', 'log', 'mailer'];
    function MailerService(plugins, log, mailer) {
        var self = this;
        var q = plugins.q;
        var validator = plugins.validator;

        self.sendRegistrationMail = function (params) {
            return q.nfcall(mailer.send, 'emails/registration', {
                to: params.user.email,
                subject: 'Testkultúra Terem - Üdvözölünk',
                userName: params.user.name,
                password: params.password
            }).thenResolve('Az üdvözlő emailt sikeresen elküldük az új felhasználónak');
        };

        self.sendResetPasswordMail = function (params) {
            return q.nfcall(mailer.send, 'emails/reset_password', {
                to: params.user.email,
                subject: 'Testkultúra Terem - Jelszó csere',
                userName: params.user.name,
                password: params.password
            }).thenResolve('Az új jelszót elküldtük a felhasználó email címére');
        };
    }

})();