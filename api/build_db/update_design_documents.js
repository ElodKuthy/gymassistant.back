(function() {
    'use strict';
    module.exports = DesignDocumentsUpdater;

    DesignDocumentsUpdater.$inject = ['plugins', 'coachUtils'];
    function DesignDocumentsUpdater (plugins, coachUtils) {

        var self = this;
        var q = plugins.q;

        self.design = {
            users: {
                views: {
                    byName: {
                        map: "function (doc) { if (doc.type === 'user' && doc.name) { emit(doc.name, { _id: doc._id, name: doc.name, email: doc.email, registration: doc.registration, roles: doc.roles, qr: doc.qr, credits: doc.credits } ) }  } "
                    },
                    byEmail: {
                        map: "function (doc) { if (doc.type === 'user' && doc.email) { emit(doc.email, { _id: doc._id, name: doc.name, email: doc.email } ) }  } "
                    },
                    byNameFull: {
                        map: "function (doc) { if (doc.type === 'user' && doc.name) { emit(doc.name, doc) }  } "
                    }
                }
            },
            credits: {
                views: {
                    byId: {
                        map: "function (doc) { if (doc.type === 'user') { emit (doc._id, doc.credits) } }"
                    },
                    byName: {
                        map: "function (doc) { if (doc.type === 'user') { emit (doc.name, doc.credits) } }"
                    }
                }
            },
            trainings: {
                views: {
                   byId: {
                        map: "function (doc) { if (doc.type === \"training\" && doc._id) { emit(doc._id, doc) } }"
                    },
                    byDate: {
                        map: "function (doc) { if (doc.type === \"training\" && doc.date) { emit(doc.date, doc) } }"
                    },
                    bySeriesAndDate: {
                        map: "function (doc) { if (doc.type === \"training\" && doc.series && doc.date) { emit([doc.series, doc.date], doc ) } }"
                    },
                    byCoachAndDate: {
                        map: "function (doc) { if (doc.type === \"training\" && doc.coach && doc.date) { emit([doc.coach, doc.date], { \"_id\": doc._id } ) } }"
                    }
                }
            },
            series: {
                views: {
                    byCoach: {
                        map: "function (doc) { if (doc.type === \"training series\" && doc.coach) { emit(doc.coach, doc ) } }"
                    },
                    byDate: {
                        map: "function (doc) { if (doc.type === \"training series\" && doc.date) { emit(doc.date, doc ) } }"
                    }
                }
            }
        };

        self.build = function () {

            return q.all([
                coachUtils.put('_design/users', self.design.users),
                coachUtils.put('_design/credits', self.design.credits),
                coachUtils.put('_design/trainings', self.design.trainings),
                coachUtils.put('_design/series', self.design.series)
            ]);
        };

        function compareDesignDocuments (left, right) {
            return (JSON.stringify(left.views) === JSON.stringify(right.views));
        }

        self.update = function () {

            return q.all([
                coachUtils.get('_design/users'),
                coachUtils.get('_design/credits'),
                coachUtils.get('_design/trainings'),
                coachUtils.get('_design/series')
            ])
            .spread(function (users, credits, trainings, series) {
                var promisies = [];

                if (!compareDesignDocuments(users, self.design.users)) {
                    promisies.push(coachUtils.put('_design/users', { _id: users._id, _rev: users._rev, views: self.design.users.views }));
                }
                if (!compareDesignDocuments(credits, self.design.credits)) {
                    promisies.push(coachUtils.put('_design/credits', { _id: credits._id, _rev: credits._rev, views: self.design.credits.views }));
                }
                if (!compareDesignDocuments(trainings, self.design.trainings)) {
                    promisies.push(coachUtils.put('_design/trainings', { _id: trainings._id, _rev: trainings._rev, views: self.design.trainings.views }));
                }
                if (!compareDesignDocuments(series, self.design.series)) {
                    promisies.push(coachUtils.put('_design/series', { _id: series._id, _rev: series._rev, views: self.design.series.views }));
                }

                return q.all(promisies);
            });
        };
    }
})();