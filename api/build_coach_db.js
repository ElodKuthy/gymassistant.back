var container = require('./container.js')('config.json');

var plugins = container.get('plugins');
var request = plugins.request;
var jsonfile = plugins.jsonfile;
var uuid = plugins.uuid;
var q = plugins.q;
var crypto = plugins.crypto;
var moment = plugins.moment;
var coachUtils = container.get('coachUtils');

var users = jsonfile.readFileSync(__dirname + '/users.json');
var trainings = jsonfile.readFileSync(__dirname + '/trainings.json');

function createHash(password) {
    var sha512 = crypto.createHash('sha512');
    sha512.update(password, 'utf8');
    var hash = sha512.digest(password);
    return hash.toString('base64');
}

function rebuild() {

    var deferred = q.defer();

    var firstDate = moment({ year: 2014, month: 11 }).startOf('month').subtract({ hours: 1 });
    var lastDate = moment({ year: 2016, month: 1 }).endOf('month').subtract({ hours: 1 });

    coachUtils.deleteDb().then(build, build);

    function build () {
        coachUtils.createDb().then(function () {

            coachUtils.request('PUT', '_design/users', {
                "views": {
                    "byName": {
                       "map": "function (doc) { if (doc.type === 'user' && doc.name) { emit(doc.name, { _id: doc._id, name: doc.name, email: doc.email, registration: doc.registration, roles: doc.roles, qr: doc.qr, credits: doc.credits } ) }  } "
                    },
                    "byNameFull": {
                        "map": "function (doc) { if (doc.type === 'user' && doc.name) { emit(doc.name, doc) }  } "
                    }
                }
            });

            coachUtils.request('PUT', '_design/credits', {
               "views": {
                    "byId": {
                        "map": "function (doc) { if (doc.type === 'user') { emit (doc._id, doc.credits) } }"
                    },
                    "byName": {
                        "map": "function (doc) { if (doc.type === 'user') { emit (doc.name, doc.credits) } }"
                    }
                }
            });

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
            });

            coachUtils.request('PUT', '_design/series', {
                "views": {
                    "byCoach": {
                        "map": "function (doc) { if (doc.type === \"training series\" && doc.coach) { emit(doc.coach, doc ) } }"
                    }
                }
            });

            var requests = [];

            users.forEach(function (user) {

                user.hash = createHash(user.password);
                user.password = undefined;
                user.credits = [];
                user.type = 'user';

                requests.push(coachUtils.request('PUT', user._id, user));
            });

            trainings.forEach(function (training) {

                training.type = 'training series';

                for (var date = firstDate.clone().day(training.date.day).hour(training.date.hour);
                     date.isBefore(lastDate);
                     date.add({weeks: 1})) {

                    var instance = {
                        _id: uuid.v4(),
                        series: training._id,
                        name: training.name,
                        coach: training.coach,
                        date: date.unix(),
                        max: training.max,
                        attendees: [],
                        type: 'training',
                        status: 'normal'
                    };

                    requests.push(coachUtils.request('PUT', instance._id, instance));
                }

                requests.push(coachUtils.request('PUT', training._id, training));
            });


            q.all(requests).then(function () { deferred.resolve(null); });
        });
    }

    return deferred.promise;
}

rebuild();