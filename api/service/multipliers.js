(function() {
    'use strict';

    module.exports = Multipliers;

    Multipliers.$inject = ['errors', 'periods'];
    function Multipliers(errors, periods) {

      var self = this;

      var _single = [2];

      var _fourWeeks = [1.75, 1.5, 1.25, 1.1, 1, 0.95, 0.9];

      var _twelveWeeks = [1.6, 1.2, 1, 0.88, 0.8, 0.76, 0.72];

      self.get = function(period, amount) {

        var result;

        if (period === periods.today && amount == 1) {
          result = _single[amount - 1];
        }

        if (period === periods.fourWeeks) {
          result = _fourWeeks[Math.round(amount / 4) - 1];
        }

        if (period === periods.twelveWeeks) {
          result = _twelveWeeks[Math.round(amount / 12) - 1];
        }

        if (!result) {
          throw errors.invalidPeriod();
        }

        return result;
      };
    }

})();