var container = require('./container.js')('config.json');

var plugins = container.get('plugins');
var request = plugins.request;
var jsonfile = plugins.jsonfile;
var uuid = plugins.uuid;
var q = plugins.q;
var moment = plugins.moment;
var coachUtils = container.get('coachUtils');
var identityService = container.get('identityService');

function split() {
    var originals = {};
    var replacements = {};

    return coachUtils.get('_design/series/_view/byCoach')
        .then(function (original) {

            var results = [];
            original.forEach(function (instance) {

                instance.date = (instance.dates && instance.dates.length > 0) ? instance.dates[0] : instance.date;
                instance.status = 'normal';
                results.push(instance);
                originals[instance._id] = instance.date;

                if (instance.dates && instance.dates.length > 1) {
                    var additionalDates = instance.dates.slice(1);

                    additionalDates.forEach(function (additionalDate) {
                        var additionalInstance = {
                            _id: uuid.v4(),
                            name: instance.name,
                            coach: instance.coach,
                            date: additionalDate,
                            max: instance.max,
                            status: instance.status,
                            type: instance.type
                        };

                        replacements[instance._id] = additionalInstance._id;
                        results.push(additionalInstance);
                    })
                }

                if (instance.dates)
                    delete instance.dates;

            });

            var promisies = [];

            results.forEach(function (result) { promisies.push(coachUtils.put(result._id, result)); });

            return q.all(promisies);
        })
        .then (function () {

            return coachUtils.get('/_design/trainings/_view/byDate');
        })
        .then (function (trainings) {
            var promisies = [];

            trainings.forEach(function (training) {
                var date = moment.unix(training.date);

                if (date.isoWeekday() != originals[training.series].day || date.hour() != originals[training.series].hour) {
                    training.series = replacements[training.series];
                    promisies.push(coachUtils.put(training._id, training));
                }
            });

            return q.all(promisies);
        });
}

split().done(function() {console.log('Done'); }, function (err) { console.log(err); });