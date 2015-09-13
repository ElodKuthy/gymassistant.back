(function () {
    'use strict';

    module.exports = MailerService;

    MailerService.$inject = ['plugins', 'log', 'mailer'];

    function MailerService(plugins, log, mailer) {
        var self = this;
        var q = plugins.q;
        var validator = plugins.validator;
        var moment = plugins.moment;

        self.sendRegistrationMail = function (args) {
            return q.nfcall(mailer.send, 'emails/registration', {
                to: args.client.email,
                subject: 'Testkultúra Terem Segéd - Üdvözölünk',
                userName: args.client.name,
                token: args.token
            });
        };

        self.sendCoachRegistrationMail = function (args) {
            return q.nfcall(mailer.send, 'emails/coach_registration', {
                to: args.client.email,
                subject: 'Testkultúra Terem Segéd - Üdvözölünk',
                userName: args.client.name,
                token: args.token
            });
        };

        self.sendForgottenPasswordMail = function (args) {
            return q.nfcall(mailer.send, 'emails/forgotten_password', {
                to: args.client.email,
                subject: 'Testkultúra Terem Segéd - Elfelejtett jelszó',
                userName: args.client.name,
                token: args.token
            });
        };

        self.sendChangedPasswordMail = function (args) {
            return q.nfcall(mailer.send, 'emails/changed_password', {
                to: args.user.email,
                subject: 'Testkultúra Terem Segéd - Jelszóváltoztatás',
                userName: args.user.name
            });
        };

        self.sendCancelledTrainingNotification = function (args) {
            return q.nfcall(mailer.send, 'emails/cancelled_training', {
                to: args.client.email,
                subject: 'Testkultúra Terem Segéd - Elmarad egy edzés',
                userName: args.client.name,
                trainingName: args.training.name + ' - ' + args.training.coach,
                trainingDate: moment(args.training.date).format('YYYY. MM. DD. HH:mm')
            });
        };

        self.sendExpirationReminder = function (args) {
            return q.nfcall(mailer.send, 'emails/expiration_reminder', {
                to: args.client.email,
                bcc: 'support@tkmuhely.hu',
                subject: 'Testkultúra Terem Segéd - Emlékeztető bérlet lejárati idejéről',
                userName: args.client.name,
                purchaseDate: moment.unix(args.credit.date).format('YYYY. MM. DD'),
                expiryDate: moment.unix(args.credit.expiry).format('YYYY. MM. DD'),
                amount: args.credit.amount,
                participated: args.participated,
                missed: args.missed,
                attended: args.attended,
                free: args.credit.free,
                unsubscribe: args.client.preferences.id
            });
        };

        self.sendNewsletter = function (args) {
            return q.nfcall(mailer.send, 'emails/newsletter', {
                to: args.client.email,
                subject: args.subject,
                userName: args.client.name,
                content: args.content,
                unsubscribe: args.client.preferences.id
            });
        };
    }

})();