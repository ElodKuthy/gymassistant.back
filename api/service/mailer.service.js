(function () {
    'use strict';

    module.exports = MailerService;

    MailerService.$inject = ['plugins', 'log', 'mailer'];
    function MailerService(plugins, log, mailer) {
        var self = this;
        var q = plugins.q;
        var validator = plugins.validator;

        self.sendRegistrationMail = function (args) {
            return q.nfcall(mailer.send, 'emails/registration', {
                to: args.email,
                subject: 'Edzőterem Segéd - Üdvözölünk',
                userName: args.client.name,
                token: args.token
            });
        };

        self.sendCoachRegistrationMail = function (args) {
            return q.nfcall(mailer.send, 'emails/coach_registration', {
                to: args.email,
                subject: 'Edzőterem Segéd - Üdvözölünk',
                userName: args.client.name,
                token: args.token
            });
        };

        self.sendForgottenPasswordMail = function (args) {
            return q.nfcall(mailer.send, 'emails/forgotten_password', {
                to: args.email,
                subject: 'Edzőterem Segéd - Elfelejtett jelszó',
                userName: args.client.name,
                token: args.token
            });
        };

        self.sendChangedPasswordMail = function (args) {
            return q.nfcall(mailer.send, 'emails/changed_password', {
                to: args.user.email,
                subject: 'Edzőterem Segéd - Jelszóváltoztatás',
                userName: args.user.name
            });
        };
    }

})();