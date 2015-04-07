(function() {
    'use strict';

    module.exports = Multipliers;

    Multipliers.$inject = ['errors', 'periods'];
    function Multipliers(errors, periods) {

      var self = this;

      var _single = {
        '1': 2
      };

      var _fourWeeks = {
        '1': 1.75,
        '2': 1.5,
        '3': 1.25,
        '4': 1.1,
        '5': 1,
        '6': 0.95,
        '7': 0.9
      };

      var _twelveWeeks = {
        '1': 1.6,
        '2': 1.2,
        '3': 1,
        '4': 0.88,
        '5': 0.8,
        '6': 0.76,
        '7': 0.72
      };

      self.get = function(period, amount) {

        var result;

        if (period === periods.today && amount == 1) {
          result = _single[amount];
        }

        if (period === periods.fourWeeks) {
          result = _fourWeeks[Math.floor(amount / 4)];
        }

        if (period === periods.fourWeeks) {
          result = _twelveWeeks[Math.floor(amount / 12)];
        }

        if (!result) {
          throw errors.invalidPeriod();
        }

        return result;
      };
    }

})();