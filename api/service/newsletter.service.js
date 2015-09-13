'use strict';

module.exports = NewsletterService;

NewsletterService.$inject = ['plugins', 'log', 'coachUtils', 'identityService', 'mailerService'];

function NewsletterService(plugins, log, coachUtils, identityService, mailerService) {
    var self = this;
    var q = plugins.q;

    self.sendNewsletter = function (args, index) {
        return q(args)
            .then(identityService.checkAdmin)
            .then(function () {
                return coachUtils.get('_design/users/_view/byNameFull').then(function (results) {
                    args.users = results;
                    return sendNewsletterToNextUser(args, 0);
                });
            });
    }

    function sendNewsletterToNextUser(args, index) {
        if (index < args.users.length) {
            return sendNewsletterToNextUser(args, index + 1)
                .then(function () {
                    if (checkPreferences(args, index)) {
                        return mailerService.sendNewsletter({
                            client: args.users[index],
                            subject: args.subject,
                            content: args.content
                        });
                    }
                });
        }

        return q(args);
    }

    function checkPreferences(args, index) {
        return args.users[index].preferences.newsletter && args.users[index].email;
    }
}