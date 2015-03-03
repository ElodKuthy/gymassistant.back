(function () {
    'use strict';

    module.exports = AttendeesService;

    AttendeesService.$inject = ['plugins', 'errors', 'trainingService', 'creditsService', 'log', 'users', 'trainings', 'roles', 'identityService'];
    function AttendeesService(plugins, errors, trainingService, creditsService, log, users, trainings, roles, identityService) {
        var self = this;
        var q = plugins.q;
        var moment = plugins.moment;

        function validate(args) {

            if (!args.user) {
                throw errors.missingProperty(args.opName, 'Felhasználó');
            }

            if (!args.client) {
                throw errors.missingProperty(args.opName, 'Tanítvány');
            }

            if (!args.training) {
                throw errors.missingProperty(args.opName, 'Edzés');
            }

            if (!args.purpose) {
                throw errors.missingProperty(args.opName, 'Művelet típusa');
            }

            var adminMode = roles.isAdmin(args.user);

            if (!adminMode && moment().isAfter(args.training.date, 'day')) {
                throw errors.trainingEnded();
            }

            if (args.training.status === 'cancel') {
                throw errors.trainingCanceled();
            }

            if ((['join', 'add']).indexOf(args.purpose) > -1 && args.training.current === args.training.max) {
                throw errors.trainingFull();
            }

            if ((['check in']).indexOf(args.purpose) > -1 && moment().isBefore(args.training.date, 'day')) {
                throw errors.tooEarlyToCheckIn();
            }

            if ((['join', 'add']).indexOf(args.purpose) > -1 && trainingService.isAttendee(args.training, args.client)) {
                throw errors.alreadySignedUp();
            }

            if ((['join', 'add', 'check in']).indexOf(args.purpose) > -1 && args.training.coach === args.client.name) {
                throw errors.selfAttend();
            }

            if ((['remove', 'check in', 'check out']).indexOf(args.purpose) > -1 && !adminMode && args.training.coach != args.user.name) {
                throw errors.cantModifyNotOwnTraining();
            }

            if ((['leave', 'remove', 'check in']).indexOf(args.purpose) > -1 && !trainingService.isAttendee(args.training, args.client)) {
                throw errors.notSignedUp();
            }

            if ((['check in']).indexOf(args.purpose) > -1 && args.training.attendees[findAttendee(args.training.attendees, args.client.name)].checkedIn) {
                throw errors.alreadyCheckedIn();
            }

            if ((['undo check in']).indexOf(args.purpose) > -1 && !args.training.attendees[findAttendee(args.training.attendees, args.client.name)].checkedIn) {
                throw errors.notCheckedIn();
            }

            if (!adminMode && (['leave', 'remove']).indexOf(args.purpose) > -1 && moment().add({ hours: 3 }).isAfter(args.training.date)) {
                throw errors.toLateToLeave();
            }

            return args;
        }

        function addCoach(args) {

            args.training.attendees.push({
                name: args.client.name,
                type: 'coach',
                checkedIn: false
            });

            return trainings.updateAttendees(args.training._id, args.training.attendees)
                .then(function () { return args.training.attendees; });
        }

        function addClient(args) {

            return creditsService.bookFreeCredit(args)
                .then(function (bookedCredit) {

                    args.training.attendees.push({
                        name: args.client.name,
                        type: bookedCredit.coach === args.training.coach ? 'normal' : 'guest',
                        ref: bookedCredit.id,
                        checkedIn: false
                    });

                    return trainings.updateAttendees(args.training._id, args.training.attendees)
                        .then(function () { return args.training.attendees; });
                });
        }

        function add(args) {
            return roles.isCoach(args.client) ? addCoach(args) : addClient(args);
        }

        function findClient(args) {

            if (!args.userName) {
                throw errors.missingProperty(args.opName, 'Tanítvány neve');
            }

            return q(args.userName)
                .then(identityService.findByName)
                .then(function (client) {
                    args.client = client;
                    return args;
                });
        }

        function findTraining(args) {

            if (!args.id) {
                throw errors.missingProperty(args.opName, 'Edzés azonosító');
            }

            return q(args.id)
                .then(trainingService.findByIdFull)
                .then(function (training) {
                    args.training = training;
                    return args;
                });
        }

        self.addToTraining = function(args) {

            args.opName = 'Felírás órára';
            args.purpose = 'add';

            return q(args)
                .then(identityService.checkCoach)
                .then(findClient)
                .then(findTraining)
                .then(validate)
                .then(add);
        };

        self.joinTraining = function(args) {

            args.opName = 'Feliratkozás';
            args.purpose = 'join';
            args.client = args.user;
            args.userName = args.user.name;

            return q(args)
                .then(identityService.checkLoggedIn)
                .then(findTraining)
                .then(validate)
                .then(add);
        };

        function findAttendee(attendees, name) {
            for (var index = 0; index < attendees.length; index++) {
                if (attendees[index].name === name) {
                    return index;
                }
            }
            return -1;
        }

        function removeCoach(args) {

            args.training.attendees.splice(findAttendee(args.training.attendees, args.client.name), 1);

            return trainings.updateAttendees(args.training._id, args.training.attendees)
                .then(function () { return args.training.attendees; });
        }

        function removeClient(args) {

            var attendeeToRemoveIndex = findAttendee(args.training.attendees, args.client.name);
            var creditToAddId = args.training.attendees[attendeeToRemoveIndex].ref;
            args.training.attendees.splice(attendeeToRemoveIndex, 1);

            return trainings.updateAttendees(args.training._id, args.training.attendees)
                .then(function () { return users.increaseFreeCredit(args.client._id, creditToAddId) })
                .then(function () { return args.training.attendees; });
        }

        function remove(args) {
            return roles.isCoach(args.client) ? removeCoach(args) : removeClient(args);
        }

        self.leaveTraining = function(args) {

            args.opName = 'Lemondás';
            args.purpose = 'leave';
            args.client = args.user;

            return q(args)
                .then(identityService.checkLoggedIn)
                .then(findTraining)
                .then(validate)
                .then(remove);

        };

        self.removeFromTraining = function(args) {

            args.opName = 'Eltávolítás óráról';
            args.purpose = 'remove';

            return q(args)
                .then(identityService.checkCoach)
                .then(findClient)
                .then(findTraining)
                .then(validate)
                .then(remove);
        };

        function setCheckedIn(args) {

            args.training.attendees[findAttendee(args.training.attendees, args.client.name)].checkedIn = true;

            return trainings.updateAttendees(args.training._id, args.training.attendees)
                .then(function () { return args.training.attendees; });
        }

        self.checkIn = function(args) {

            args.opName = 'Bejelentkezés';
            args.purpose = 'check in';

            return q(args)
                .then(identityService.checkCoach)
                .then(findClient)
                .then(findTraining)
                .then(validate)
                .then(setCheckedIn);
        };

        function unsetCheckIn(args) {

            args.training.attendees[findAttendee(args.training.attendees, args.client.name)].checkedIn = false;

            return trainings.updateAttendees(args.training._id, args.training.attendees)
                .then(function () { return args.training.attendees; });
        }

        self.undoCheckIn = function(args) {

            args.opName = 'Bejelentkezés visszavonása';
            args.purpose = 'undo check in';

            return q(args)
                .then(identityService.checkCoach)
                .then(findClient)
                .then(findTraining)
                .then(validate)
                .then(unsetCheckIn);
        };
    }
})();