(function () {
    'use strict';
    /*jshint expr: true*/

    describe('Schedule service', function () {

        var container = require('../container.js')('test_config.json');

        var plugins = container.get('plugins');
        var expect = plugins.expect;
        var moment = plugins.moment;
        var q = plugins.q;

        it('should be defined', function () {
            var scheduleService = container.get('scheduleService');

            expect(scheduleService).to.exist;
        });

        var coachUtils = container.get('coachUtils');
        var buildViews = container.get('buildViews');
        var errors = container.get('errors');

        function success(end) {
            return function () {
                end();
            };
        }

        beforeEach('Set up test db', function (end) {
            coachUtils.createDb()
                .then(buildViews.build, buildViews.build)
                .then(success(end))
                .catch(end)
                .done();
        });

        afterEach('Tear down test db', function (end) {
            coachUtils.deleteDb()
                .then(success(end))
                .catch(end)
                .done();
        });

        describe('cancel training', function () {

            var trainingId = 'test_training_id';
            var oldTrainingId = 'old_training_id';
            var closeToStartTrainingId = 'close_to_start_training_id';
            var otherCoachsTrainingId = 'other_coachs_training_id';
            var canceledTrainingId = 'canceled_training_id';
            var creditId = 'test_credit_id';
            var userId = 'test_user_id';
            var userName = 'Test User';
            var coachName = 'Test Coach';
            var otherCoachName = 'Test Coach 2';
            var trainingName = 'Test training';

            var coach = { name: coachName };
            var otherCoach = { name: otherCoachName };

            var user = {
                name: userName,
                credits:[
                    {
                        id: creditId,
                        date: moment().subtract({ week: 1 }).unix(),
                        expiry: moment().add({ week: 1 }).unix(),
                        coach: coachName,
                        amount: 8,
                        free : 0
                    }
                ],
                type: 'user'
            };

            var normalTraining = {
                _id: trainingId,
                series: trainingId,
                name: trainingName,
                coach: coachName,
                date: moment().add({ day: 1 }).unix(),
                max: 16,
                attendees: [
                    {
                        name: userName,
                        type: 'normal',
                        ref: creditId
                    }
                ],
                type: 'training',
                status: 'normal'
            };

            var oldTraining = {
                _id: oldTrainingId,
                series: trainingId,
                name: trainingName,
                coach: coachName,
                date: moment().subtract({ day: 1 }).unix(),
                max: 16,
                attendees: [
                    {
                        name: userName,
                        type: 'normal',
                        ref: creditId
                    }
                ],
                type: 'training',
                status: 'normal'
            };

            var closeToStartTraining = {
                _id: closeToStartTrainingId,
                series: trainingId,
                name: trainingName,
                coach: coachName,
                date: moment().add({ hour: 1 }).unix(),
                max: 16,
                attendees: [
                    {
                        name: userName,
                        type: 'normal',
                        ref: creditId
                    }
                ],
                type: 'training',
                status: 'normal'
            };

            var otherCoachsTraining = {
                _id: otherCoachsTrainingId,
                series: trainingId,
                name: trainingName,
                coach: otherCoachName,
                date: moment().add({ day: 1 }).unix(),
                max: 16,
                attendees: [],
                type: 'training',
                status: 'normal'
            };

            var canceledTraining = {
                _id: canceledTrainingId,
                series: trainingId,
                name: trainingName,
                coach: coachName,
                date: moment().add({ day: 1 }).unix(),
                max: 16,
                attendees: [],
                type: 'training',
                status: 'cancel'
            };

            var trainings = [
                normalTraining,
                oldTraining,
                closeToStartTraining,
                otherCoachsTraining,
                canceledTraining
            ];

            function addUser() {
                return coachUtils.request('PUT', userId, user);
            }

            function addTrainings() {
                var promisies = [];
                trainings.forEach(function (training) {
                    promisies.push(coachUtils.put(training._id, training));
                });
                return q.all(promisies);
            }

            beforeEach('Set up test data in db', function (end) {
                    addUser()
                        .then(addTrainings)
                        .then(success(end))
                        .catch(end)
                        .done();
            });

            function shouldNotHappen (result) {
                throw (new Error(result));
            }

            function checkError (expectedError) {
                return function (err) {
                    expect(err.message).to.equal(expectedError.message);
                };
            }

            function getTraining (id) {
                return function () {
                    return coachUtils.get(id);
                };
            }

            function checkTraining (expected) {
                return function (training) {
                    expect(training.status).to.equal(expected.status);
                    expect(training.attendees.length).to.equal(expected.attendees.length);
                    for(var index = 0; index < expected.attendees.length; index++) {
                        expect(training.attendees[index].name).to.equal(expected.attendees[index].name);
                    }
                };
            }

            function getUser (id) {
                return function () {
                    return coachUtils.get(userId);
                };
            }
            function checkUserFreeCredit (free) {
                return function (user) {
                    expect(user.credits[0].free).to.equal(free);
                };
            }

            it('should cancel the proper training, and refund the attendees', function (end) {
                var scheduleService = container.get('scheduleService');

                scheduleService.cancelTraining(trainingId, coach)
                    .then(checkResult)
                    .then(getTraining(trainingId))
                    .then(checkTraining({ status: 'cancel', attendees: [] }))
                    .then(getUser(userId))
                    .then(checkUserFreeCredit(1))
                    .then(success(end))
                    .catch(end)
                    .done();

                function checkResult (result) {
                    expect(result).to.equal('A edzést sikeresen töröltük');
                }
            });

            it('should return error, if the training does not exists', function (end) {
                var scheduleService = container.get('scheduleService');

                scheduleService.cancelTraining('invalid_training_id', coach)
                    .then(shouldNotHappen)
                    .catch(checkError(errors.invalidTrainingId()))
                    .then(success(end))
                    .catch(end)
                    .done();
            });

            it('should return error, if the training is history', function (end) {
                var scheduleService = container.get('scheduleService');

                scheduleService.cancelTraining(oldTrainingId, coach)
                    .then(shouldNotHappen)
                    .catch(checkError(errors.trainingEnded()))
                    .then(getTraining(oldTrainingId))
                    .then(checkTraining(oldTraining))
                    .then(getUser(userId))
                    .then(checkUserFreeCredit(0))
                    .then(success(end))
                    .catch(end)
                    .done();
            });

            it('should return error, if the training time is closer than 3 hours', function (done) {
                var scheduleService = container.get('scheduleService');

                scheduleService.cancelTraining(closeToStartTrainingId, coach)
                    .then(shouldNotHappen)
                    .catch(checkError(errors.toLateToLeave()))
                    .then(getTraining(closeToStartTrainingId))
                    .then(checkTraining(closeToStartTraining))
                    .then(getUser(userId))
                    .then(checkUserFreeCredit(0))
                    .then(success(done))
                    .catch(done)
                    .done();
            });

            it('should return error, if not the coach of the training is trying to cancel', function (done) {
                var scheduleService = container.get('scheduleService');

                scheduleService.cancelTraining(otherCoachsTrainingId, coach)
                    .then(shouldNotHappen)
                    .catch(checkError(errors.cantModifyNotOwnTraining()))
                    .then(getTraining(otherCoachsTrainingId))
                    .then(checkTraining(otherCoachsTraining))
                    .then(success(done))
                    .catch(done)
                    .done();
            });

            it('should return error, if the training already has been canceled', function (done) {
                var scheduleService = container.get('scheduleService');

                scheduleService.cancelTraining(canceledTrainingId, coach)
                    .then(shouldNotHappen)
                    .catch(checkError(errors.trainingCanceled()))
                    .then(getTraining(canceledTrainingId))
                    .then(checkTraining(canceledTraining))
                    .then(success(done))
                    .catch(done)
                    .done();
            });
        });
    });

})();