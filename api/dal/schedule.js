(function () {
    "use strict";

    exports.today = today;
    exports.thisWeek = thisWeek;
    exports.fetch = fetch;
    exports.findById = findById;
    exports.roolback = loadSchedule;
    exports.commit = saveSchedule;

    var jfs = require("jsonfile");
    var moment = require("moment");

    var training = require("./../model/training.js");

    var schedule = [];

    loadSchedule();

    function loadSchedule() {
        jfs.readFileSync(__dirname + "./../data/schedule.json")
            .schedule.forEach(function (instance) {
                schedule.push(new training.ctor(instance));
        });
    }

    function thisWeek(user) {
        var startDate = moment().startOf("week").add({ days: 1 });
        var endDate = moment().startOf("week").add({ days: 7 });

        return fetch(startDate, endDate, user);
    }

    function today(user) {
        var startDate = moment().startOf("day");
        var endDate = moment().startOf("day").add({ days: 1 });

        return fetch(startDate, endDate, user);
    }

    function fetch(startDate, endDate, user) {

        var result = {};

        result.dates = {
            begin: moment(startDate),
            end: moment(endDate)
        };

        result.schedule = [];

        var index = 0;
        while (moment(schedule[index].date).isBefore(startDate) && index < schedule.length) {
            index++;
        }

        for (var current = schedule[index];
             moment(current.date).isBefore(endDate) && index < schedule.length;
             current = schedule[++index]) {

            result.schedule.push(current.toJSON(user));
        }

        return result;
    }

    function findById(id) {
        for (var index = 0; index < schedule.length; index++) {
            if (schedule[index].id === id) {
                return schedule[index];
            }
        }
    }

    function saveSchedule() {
        var data = {};
        data.schedule = [];
        schedule.forEach(function (instance) {
            data.schedule.push(instance.toData());
        });
        jfs.writeFileSync(__dirname + "./../data/schedule.json", data);
    }
})();