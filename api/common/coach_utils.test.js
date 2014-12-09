(function () {
    'use strict';
    /*jshint expr: true*/

    describe('CoachDB utils', function () {

        var expect = require('chai').expect;
        var a = require('a');

        var container = require('../container.js');
        var CoachUtils = require('./coach_utils.js');

        var plugins = container.get('plugins');
        var config = container.get('config');

        var logMock = {
            debug: function () {},
            error: function () {}
        };

        var configMock = {
            db: {
                server: config.db.server,
                name: "db_test_coach_utils"
            }
        };

        var testDbUrl = configMock.db.server + configMock.db.name;

        it('should be defined', function () {
            var coachUtils = new CoachUtils(logMock, plugins, configMock);
            expect(coachUtils).to.exist;
        });

        describe('auxiliary functionalities', function () {

            describe('sting key query parameter', function () {

                it('should be empty if there is no parameter', function () {
                    var coachUtils = new CoachUtils(logMock, plugins, configMock);
                    var key = coachUtils.addKey();
                    expect(key).to.be.empty;
                });

                it('should be a string key, if there is one parameter', function () {
                    var coachUtils = new CoachUtils(logMock, plugins, configMock);
                    var key = coachUtils.addKey('parameter');
                    expect(key).to.equal('?key="parameter"');
                });

                it('should be a string startkey and endkey, if there are two items in the parameter array', function () {
                    var coachUtils = new CoachUtils(logMock, plugins, configMock);
                    var key = coachUtils.addKey(['parameter1', 'parameter2']);
                    expect(key).to.equal('?startkey="parameter1"&endkey="parameter2"');
                });
            });

            describe('data key query parameter', function () {

                it('should be empty if there is no parameter', function () {
                    var coachUtils = new CoachUtils(logMock, plugins, configMock);
                    var key = coachUtils.addDateKey();
                    expect(key).to.be.empty;
                });

                it('should be an integer key of a unix epoch timestamp, if there is one parameter', function () {
                    var coachUtils = new CoachUtils(logMock, plugins, configMock);
                    var key = coachUtils.addDateKey('2014-12-12');
                    expect(key).to.equal('?key=1418338800');
                });

                it('should be a integer startkey and endkey of unix epoch timestamps, if there are two items in the parameter array', function () {
                    var coachUtils = new CoachUtils(logMock, plugins, configMock);
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
                var coachUtils = new CoachUtils(logMock, plugins, configMock);

                coachUtils.createDb().then(dbCreationSuccess, dbCreationError);

                function dbCreationSuccess() {
                    try {
                        plugins.request({
                            method: 'GET',
                            url: testDbUrl
                        }, getTestDbResult);
                    } catch (err) {
                        done(err);
                    }
                }

                function getTestDbResult(error, respose, body)  {
                    try {
                        expect(body).to.exist;
                        var bodyParsed = JSON.parse(body);
                        expect(bodyParsed).to.have.property('db_name', 'db_test_coach_utils');
                        done();
                    } catch (err) {
                        done(err);
                    }
                }

                function dbCreationError(err) {
                    done(err);
                }
            });

            it('should delete the proper db', function (done) {


                plugins.request({
                    method: 'PUT',
                    url: testDbUrl
                }, createDbResult);

                function createDbResult(error, respose, body) {
                    try {
                        expect(error).to.not.exist;
                        expect(body).to.exist;
                        var bodyParsed = JSON.parse(body);
                        expect(bodyParsed).to.have.property('ok', true);

                        var coachUtils = new CoachUtils(logMock, plugins, configMock);

                        coachUtils.deleteDb().then(deleteDbSuccess, deleteDbError);
                    } catch (err) {
                        done(err);
                    }
                }

                function deleteDbSuccess() {
                    try {
                        plugins.request({
                            method: 'GET',
                            url: testDbUrl
                        }, checkDbResult);
                    } catch (err) {
                        done(err);
                    }
                }

                function checkDbResult(error, respose, body)  {
                    try {
                        expect(error).to.not.exist;
                        expect(body).to.exist;
                        var bodyParsed = JSON.parse(body);
                        expect(bodyParsed).to.have.property('reason', 'no_db_file');
                        done();
                    } catch (err) {
                        done(err);
                    }
                }

                function deleteDbError(err) {
                    done(err);
                }
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

                    plugins.request({
                        method: 'PUT',
                        url: testDbUrl + '/' + testId,
                        body: JSON.stringify(testDoc)
                    }, putNewDocResult);

                    function putNewDocResult(error, response, body) {
                        try {

                            var coachUtils = new CoachUtils(logMock, plugins, configMock);

                            coachUtils.request('GET', 'test_id').then(docGetSuccess, docGetError);

                        } catch (err) {
                            done(err);
                        }
                    }

                    function docGetSuccess(result) {
                        try {
                            expect(result).to.exist;
                            expect(result).to.have.property('_id', testId);
                            expect(result._rev).to.match(/^1/);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }

                    function docGetError(err) {
                        done(err);
                    }

                });

                it('send proper put request', function (done) {

                    var testId = 'test_id';
                    var testDoc = { _id: 'test_id' };

                    plugins.request({
                        method: 'PUT',
                        url: testDbUrl + '/' + testId,
                        body: JSON.stringify(testDoc)
                    }, putNewDocResult);

                    function putNewDocResult(error, response, body) {
                        try {
                            expect(error).to.not.exist;
                            expect(body).to.exist;
                            var bodyParsed = JSON.parse(body);
                            expect(bodyParsed).to.have.property('rev');

                            testDoc._rev = bodyParsed.rev;
                            testDoc.newValue = 'newValue';

                            var coachUtils = new CoachUtils(logMock, plugins, configMock);

                            coachUtils.request('PUT', testId, testDoc).then(docUpdateSuccess, docUpdateError);

                        } catch (err) {
                            done(err);
                        }
                    }

                    function docUpdateSuccess(result) {
                        try {
                            expect(result).to.exist;
                            expect(result.ok).to.be.true;
                            expect(result.id).to.be.equal(testId);
                            expect(result.rev).to.match(/^2/);
                            done();
                        } catch (err) {
                            done(err);
                        }

                    }

                    function docUpdateError(err) {
                        done(err);
                    }
                });
            });

            describe('update doc', function () {
                it('should handle parallel doc updates correctly', function (done) {

                    var testId = 'test_id';
                    var testDoc = { _id: 'test_id', counter: 10 };

                    var coachUtils = new CoachUtils(logMock, plugins, configMock);

                    plugins.request({
                        method: 'PUT',
                        url: testDbUrl + '/' + testId,
                        body: JSON.stringify(testDoc)
                    }, putNewDocResult);

                    function putNewDocResult() {
                        try {
                            var promises = [];
                            for (var index = 0; index < 10; index++) {
                                promises.push(coachUtils.updateDoc(testId, update));
                            }

                            plugins.q.allSettled(promises).then(allDocUpdatesDone);

                        } catch (err) {
                            done(err);
                        }
                    }

                    function update(doc) {
                        doc.counter--;
                        return plugins.q.when(doc);
                    }

                    function allDocUpdatesDone(results) {
                        try {
                            for (var index = 0; index < results.length; index++) {
                                expect(results[index]).to.have.property('state', 'fulfilled');
                            }

                            coachUtils.request('GET', testId).then(getFinalDocSuccess, getFinalDocError);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }

                    function getFinalDocSuccess(doc) {
                        try {
                            expect(doc).to.exist;
                            expect(doc._rev).to.match(/^11/);
                            expect(doc).has.property('counter', 0);
                        } catch (err) {
                            done(err);
                        }
                    }

                    function getFinalDocError(err) {
                        done(err);
                    }
                });
            });
        });
    });
})();