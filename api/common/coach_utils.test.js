(function () {
    'use strict';
    /*jshint expr: true*/

    describe('CoachDB utils', function () {

        var expect = require('chai').expect;

        var container = require('../container.js')('test_config.json');

        var plugins = container.get('plugins');
        var q = plugins.q;
        var config = container.get('config');
        var testDbUrl = config.db.server + config.db.name;

        it('should be defined', function () {
            var coachUtils = container.get('coachUtils');
            expect(coachUtils).to.exist;
        });

        describe('auxiliary functionalities', function () {

            describe('sting key query parameter', function () {

                it('should be empty if there is no parameter', function () {
                    var coachUtils = container.get('coachUtils');
                    var key = coachUtils.addKey();
                    expect(key).to.be.empty;
                });

                it('should be a string key, if there is one parameter', function () {
                    var coachUtils = container.get('coachUtils');
                    var key = coachUtils.addKey('parameter');
                    expect(key).to.equal('?key="parameter"');
                });

                it('should be a string startkey and endkey, if there are two items in the parameter array', function () {
                    var coachUtils = container.get('coachUtils');
                    var key = coachUtils.addKey(['parameter1', 'parameter2']);
                    expect(key).to.equal('?startkey="parameter1"&endkey="parameter2"');
                });
            });

            describe('data key query parameter', function () {

                it('should be empty if there is no parameter', function () {
                    var coachUtils = container.get('coachUtils');
                    var key = coachUtils.addDateKey();
                    expect(key).to.be.empty;
                });

                it('should be an integer key of a unix epoch timestamp, if there is one parameter', function () {
                    var coachUtils = container.get('coachUtils');
                    var key = coachUtils.addDateKey('2014-12-12');
                    expect(key).to.equal('?key=1418338800');
                });

                it('should be a integer startkey and endkey of unix epoch timestamps, if there are two items in the parameter array', function () {
                    var coachUtils = container.get('coachUtils');
                    var key = coachUtils.addDateKey(['2014-12-12', '2015-12-12']);
                    expect(key).to.equal('?startkey=1418338800&endkey=1449874800');
                });
            });
        });

        describe('database handling', function () {

            afterEach('Tear down test DB', function (done) {
                plugins.request({
                    method: 'DELETE',
                    url: testDbUrl
                }, done);
            });

            it('should create the proper db', function (done) {
                var coachUtils = container.get('coachUtils');

                coachUtils.createDb()
                    .then(function () {
                        return q.denodeify(plugins.request)({
                            method: 'GET',
                            url: testDbUrl
                        });
                    })
                    .then(function (results) {
                        expect(results).to.exist;
                        expect(results).to.have.length(2);
                        var parsed = JSON.parse(results[1]);
                        expect(parsed).to.have.property('db_name', config.db.name);
                    })
                    .nodeify(done);
            });

            it('should delete the proper db', function (done) {

                q.denodeify(plugins.request)({
                    method: 'PUT',
                    url: testDbUrl
                })
                .then(function (results) {
                    expect(results).to.exist;
                    expect(results).to.have.length(2);
                    var parsed = JSON.parse(results[1]);
                    expect(parsed).to.have.property('ok', true);

                    var coachUtils = container.get('coachUtils');
                    return coachUtils.deleteDb();
                })
                .then(function () {
                    return q.denodeify(plugins.request)({
                        method: 'Get',
                        url: testDbUrl
                    });
                })
                .then(function (results) {
                    expect(results).to.exist;
                    expect(results).to.have.length(2);
                    var parsed = JSON.parse(results[1]);
                    expect(parsed).to.have.property('reason', 'no_db_file');
                })
                .nodeify(done);
            });
        });

        describe('database requests', function () {

            beforeEach('Set up test DB', function (done) {
                plugins.request({
                    method: 'PUT',
                    url: testDbUrl
                }, done);
            });

            afterEach('Tear down test DB', function (done) {
                plugins.request({
                    method: 'DELETE',
                    url: testDbUrl
                }, done);
            });

            describe('make a request', function () {

                it('send proper get request', function (done) {

                    var testId = 'test_id';
                    var testDoc = { _id: 'test_id' };

                    q.denodeify(plugins.request)({
                        method: 'PUT',
                        url: testDbUrl + '/' + testId,
                        body: JSON.stringify(testDoc)
                    })
                    .then(function () {
                        var coachUtils = container.get('coachUtils');
                        return coachUtils.get(testId);
                    })
                    .then(function (result) {
                        expect(result).to.exist;
                        expect(result).to.have.property('_id', testId);
                        expect(result._rev).to.match(/^1/);
                    })
                    .nodeify(done);

                });

                it('send proper put request', function (done) {

                    var testId = 'test_id';
                    var testDoc = { _id: 'test_id' };

                    var coachUtils = container.get('coachUtils');

                    coachUtils.put(testId, testDoc)
                        .then(function (result) {
                            expect(result).to.exist;
                            expect(result.ok).to.be.true;
                            expect(result.id).to.be.equal(testId);
                            expect(result.rev).to.match(/^1/);
                        })
                        .nodeify(done);
                });
            });

            describe('update doc', function () {
                it('should handle parallel doc updates correctly', function (done) {

                    var testId = 'test_id';
                    var testDoc = { _id: 'test_id', counter: 10 };

                    var coachUtils = container.get('coachUtils');

                    function update(doc) {
                        doc.counter--;
                        return doc;
                    }

                    coachUtils.put(testId, testDoc)
                        .then(function () {
                            var promises = [];
                            for (var index = 0; index < 10; index++) {
                                promises.push(coachUtils.updateDoc(testId, update));
                            }

                            return q.allSettled(promises);
                        })
                        .then(function (updateResults) {
                            for (var index = 0; index < updateResults.length; index++) {
                                expect(updateResults[index]).to.have.property('state', 'fulfilled');
                            }

                            return coachUtils.get(testId);
                        })
                        .then(function (doc) {
                            expect(doc).to.exist;
                            expect(doc._rev).to.match(/^11/);
                            expect(doc).has.property('counter', 0);
                        })
                        .nodeify(done);

                });
            });
        });
    });
})();