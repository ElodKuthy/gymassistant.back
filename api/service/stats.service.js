(function() {
    'use strict';

    module.exports = StatsService;

    StatsService.$inject = ['plugins', 'errors', 'identityService', 'users', 'trainings', 'periods', 'multipliers'];
    function StatsService(plugins, errors, identityService, users, trainings, periods, multipliers) {

      var self = this;
      var q = plugins.q;
      var moment = plugins.moment;

      self.getOverview = function(args) {

        args.results = {};
        return args.coach ? getOverviewAdmin(args) : getOverviewCoach(args);
      };

      function getOverviewAdmin(args) {

        return q(args)
          .then(identityService.checkAdmin)
          .then(checkCoach)
          .then(getAttendeesStats)
          .then(getSubscriptions)
          .then(getGuestCredits)
          .thenResolve(args.results);
      }

      function checkCoach(args) {

        return users.byNameFull(args.coach).thenResolve(args);
      }

      function getAttendeesStats(args) {

        return trainings.byCoachFromTo(args.coach, args.from.unix(), args.to.unix())
          .then(function (results) {
            args.results.trainings = results.length;
            args.results.allAttendees = 0;
            args.results.series = [];
            var lookup = {};
            results.forEach(function (result) {
              args.results.allAttendees += result.attendees.length;
              var current = lookup[result.series];
              if (current) {
                current.ids.push(result._id);
                current.count++;
                current.attendees.sum += result.attendees.length;
                if (result.attendees.length < current.attendees.min) {
                  current.attendees.min = result.attendees.length;
                }
                if (result.attendees.length > current.attendees.max) {
                  current.attendees.max = result.attendees.length;
                }
              } else {
                current = {
                  day: moment.unix(result.date).isoWeekday(),
                  hour: moment.unix(result.date).hours(),
                  ids: [result._id],
                  attendees: {
                    sum: result.attendees.length,
                    min: result.attendees.length,
                    max: result.attendees.length
                  },
                  count: 1
                };
                args.results.series.push(current);
                lookup[result.series] = current;
              }
            });
          }).thenResolve(args);
      }

      function getSubscriptions(args) {
        args.results.subscriptions = [];
        return users.byNameAll()
          .then(function (results) {
            results.forEach(function (result) {
              result.credits.forEach(function (credit) {
                var bought = moment.unix(credit.date);
                if (credit.coach == args.coach && bought.isAfter(args.from) && bought.isBefore(args.to)) {
                  args.results.subscriptions.push(credit);
                }
              });
            });
          }).thenResolve(args);
      }

      function getGuestCredits(args) {
        args.results.guestCredits = {};

        return trainings.byDate([args.from, args.to])
          .then(function (allTrainings) {
            var promisies = [];
            allTrainings.forEach(function (training) {
              training.attendees.forEach(function (attendee) {
                if (attendee.type == 'guest') {
                  promisies.push(users.byName(attendee.name)
                    .then(function (result) {
                      result[0].credits.forEach(function (credit) {
                        if (credit.id == attendee.ref) {
                          var period = periods.parseUnixInterval(credit.expiry - credit.date);
                          var multiplier = multipliers.get(period, credit.amount);
                          var key;

                          if (credit.coach == args.coach) {
                            key = training.coach;
                            multiplier = - multiplier;
                          }
                          if (training.coach == args.coach) {
                            key = credit.coach;
                          }

                          if(key) {
                            if (!args.results.guestCredits[key]) {
                              args.results.guestCredits[key] = {
                                sum: 0
                              };
                            }
                            args.results.guestCredits[key].sum += multiplier;
                          }
                        }
                      });
                    }));
                }
              });
            });

            return q.all(promisies);
          }).thenResolve(args);
      }

      function getOverviewCoach(args) {

        return q(args)
          .then(identityService.checkCoach)
          .then(setCoach)
          .then(getAttendeesStats)
          .then(getSubscriptions)
          .then(getGuestCredits)
          .thenResolve(args.results);
      }

      function setCoach(args) {
        args.coach = args.user.name;
        return args;
      }

    }

})();