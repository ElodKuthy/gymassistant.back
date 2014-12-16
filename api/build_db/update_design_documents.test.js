(function () {
    'use strict';
    /*jshint expr: true*/

    describe('CoachDB add/update design documents', function () {

        var container = require('../container.js')('test_config.json');
        var plugins = container.get('plugins');
        var expect = plugins.expect;
        var q = plugins.q;
        var coachUtils = container.get('coachUtils');

        beforeEach('set up test db', function (done) {
            coachUtils.createDb().nodeify(done);
        });

        afterEach('tear down test db', function (done) {
            coachUtils.deleteDb().nodeify(done);
        });

        it ('should be defined', function () {
            var updater = container.get('designDocumentsUpdater');

            expect(updater).to.exist;
        });

        it ('should create the proper design documents', function (done) {
            var updater = container.get('designDocumentsUpdater');

            updater.build()
                .then(function () {
                    return q.all([
                        coachUtils.get('_design/users'),
                        coachUtils.get('_design/credits'),
                        coachUtils.get('_design/trainings'),
                        coachUtils.get('_design/series')
                    ]);
                })
                .spread(function (users, credits, trainings, series) {
                    compareDesignDocuments(users.views, updater.design.users.views);
                    compareDesignDocuments(credits.views, updater.design.credits.views);
                    compareDesignDocuments(trainings.views, updater.design.trainings.views);
                    compareDesignDocuments(series.views, updater.design.series.views);
                 })
                .catch()
                .nodeify(done);
        });

        function compareDesignDocuments(current, expected) {
            delete current._id;
            delete current._rev;
            expect(JSON.stringify(current)).to.equal(JSON.stringify(expected));
        }

        it ('should update the changed design documents', function (done) {
            var updater = container.get('designDocumentsUpdater');

            updater.build()
                .then(function () {
                    updater.design.users.views.newView = "TestView";
                    return updater.update();
                })

                .then(function () {
                    return q.all([
                        coachUtils.get('_design/users'),
                        coachUtils.get('_design/credits'),
                        coachUtils.get('_design/trainings'),
                        coachUtils.get('_design/series')
                    ]);
                })
                .spread(function (users, credits, trainings, series) {
                    compareDesignDocuments(users.views, updater.design.users.views);
                    compareDesignDocuments(credits.views, updater.design.credits.views);
                    compareDesignDocuments(trainings.views, updater.design.trainings.views);
                    compareDesignDocuments(series.views, updater.design.series.views);
                 })
                .catch()
                .nodeify(done);
        });

        it ('should not update unchanged design documents', function (done) {
            var updater = container.get('designDocumentsUpdater');

            updater.build()
                .then(function () {
                    return updater.update();
                })

                .then(function () {
                    return q.all([
                        coachUtils.get('_design/users'),
                        coachUtils.get('_design/credits'),
                        coachUtils.get('_design/trainings'),
                        coachUtils.get('_design/series')
                    ]);
                })
                .spread(function (users, credits, trainings, series) {
                    expect(users._rev).to.match(/^1-/);
                    expect(credits._rev).to.match(/^1-/);
                    expect(trainings._rev).to.match(/^1-/);
                    expect(series._rev).to.match(/^1-/);
                    compareDesignDocuments(users.views, updater.design.users.views);
                    compareDesignDocuments(credits.views, updater.design.credits.views);
                    compareDesignDocuments(trainings.views, updater.design.trainings.views);
                    compareDesignDocuments(series.views, updater.design.series.views);
                 })
                .catch()
                .nodeify(done);
        });
    });
})();