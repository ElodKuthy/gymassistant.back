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
            args.results.all = {
              attendees: 0,
              participants: 0
            };
            args.results.series = [];
            var lookup = {};
            results.forEach(function (training) {
              if (training.status == 'cancel') {
                args.results.trainings--;
              } else {
                var attendeesCount = training.attendees.length;
                var participantsCount = getParticipantsCount(training.attendees);
                args.results.all.attendees += attendeesCount;
                args.results.all.participants += participantsCount;
                var current = lookup[training.series];
                if (current) {
                  current.ids.push(training._id);
                  current.count++;
                  current.attendees.sum += attendeesCount;
                  current.participants.sum += participantsCount;
                  if (attendeesCount < current.attendees.min) {
                    current.attendees.min = attendeesCount;
                  }
                  if (participantsCount < current.participants.min) {
                    current.participants.min = participantsCount;
                  }
                  if (attendeesCount > current.attendees.max) {
                    current.attendees.max = attendeesCount;
                  }
                  if (participantsCount > current.participants.max) {
                    current.participants.max = participantsCount;
                  }
                } else {
                  current = {
                    name: training.name,
                    day: moment.unix(training.date).isoWeekday(),
                    hour: moment.unix(training.date).hours(),
                    ids: [training._id],
                    attendees: {
                      sum: attendeesCount,
                      min: attendeesCount,
                      max: attendeesCount
                    },
                    participants: {
                      sum: participantsCount,
                      min: participantsCount,
                      max: participantsCount
                    },
                    count: 1
                  };
                  args.results.series.push(current);
                  lookup[training.series] = current;
                }
              }
            });
          }).thenResolve(args);
      }

      function getParticipantsCount(attendees) {
        var participants = 0;
        attendees.forEach(function(attendee) {
          if (attendee.checkedIn) {
            participants++;
          }
        });
        return participants;
      }

      function getSubscriptions(args) {
        args.results.passiveClients = [];
        args.results.newClients = [];
        args.results.subscriptions = [];
        args.results.allSubscriptions = 0;
        return users.byNameAll()
          .then(function (results) {
            results.forEach(function (user) {
              var latest = { date: 0, expiry: 0 };
              user.credits.forEach(function (credit) {
                var bought = moment.unix(credit.date);
                var addedAsNew = false;
                credit.name = user.name;
                var period = periods.parseUnixInterval(credit.expiry - credit.date);
                credit.period = period.toLocal();
                if (credit.coach == args.coach && credit.expiry > latest.expiry) {
                  latest = credit;
                }
                if (credit.coach == args.coach && bought.isAfter(args.from) && bought.isBefore(args.to)) {
                  args.results.subscriptions.push(credit);
                  if (!addedAsNew && moment.unix(user.registration).isAfter(args.from)) {
                    args.results.newClients.push(credit);
                    addedAsNew = true;
                  }
                  if (!credit.firstTime) {
                    args.results.allSubscriptions += multipliers.getSum(period, credit.amount);
                  }
                }
              });
              var expired = moment.unix(latest.expiry);
              if (expired.isAfter(args.from) && expired.isBefore(args.to)) {
                args.results.passiveClients.push(latest);
              }
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
                                coach: key,
                                sum: 0.0
                              };
                            }
                            args.results.guestCredits[key].sum = Math.round((args.results.guestCredits[key].sum + multiplier) * 100) / 100;
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