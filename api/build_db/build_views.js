(function() {

module.exports = BuildViews;

BuildViews.$inject = ['plugins', 'coachUtils'];
function BuildViews (plugins, coachUtils) {

    var self = this;
    var q = plugins.q;

    self.build = function () {

            var promises = [

                coachUtils.request('PUT', '_design/users', {
                    "views": {
                        "byName": {
                           "map": "function (doc) { if (doc.type === 'user' && doc.name) { emit(doc.name, { _id: doc._id, name: doc.name, email: doc.email, registration: doc.registration, roles: doc.roles, qr: doc.qr, credits: doc.credits } ) }  } "
                        },
                        "byNameFull": {
                            "map": "function (doc) { if (doc.type === 'user' && doc.name) { emit(doc.name, doc) }  } "
                        }
                    }
                }),

                coachUtils.request('PUT', '_design/credits', {
                   "views": {
                        "byId": {
                            "map": "function (doc) { if (doc.type === 'user') { emit (doc._id, doc.credits) } }"
                        },
                        "byName": {
                            "map": "function (doc) { if (doc.type === 'user') { emit (doc.name, doc.credits) } }"
                        }
                    }
                }),

                coachUtils.request('PUT', '_design/trainings', {
                   "views": {
                       "byId": {
                            "map": "function (doc) { if (doc.type === \"training\" && doc._id) { emit(doc._id, doc) } }"
                        },
                        "byDate": {
                            "map": "function (doc) { if (doc.type === \"training\" && doc.date) { emit(doc.date, doc) } }"
                        },
                        "bySeriesAndDate": {
                            "map": "function (doc) { if (doc.type === \"training\" && doc.series && doc.date) { emit([doc.series, doc.date], doc ) } }"
                        },
                        "byCoachAndDate": {
                            "map": "function (doc) { if (doc.type === \"training\" && doc.coach && doc.date) { emit([doc.coach, doc.date], { \"_id\": doc._id } ) } }"
                        }
                   }
                }),

                coachUtils.request('PUT', '_design/series', {
                    "views": {
                        "byCoach": {
                            "map": "function (doc) { if (doc.type === \"training series\" && doc.coach) { emit(doc.coach, doc ) } }"
                        }
                    }
                })
            ];

            return q.allSettled(promises);
        };
    }
})();