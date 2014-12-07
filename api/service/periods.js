(function () {
    'use strict';

    module.exports = Periods;

    Periods.$inject = ['log'];
    function Periods (log) {
        var self = this;

        function Period (text, days) {
            var _text = text;
            var _days = days;

            this.toString = function() { return _text; };
            this.days = function() { return _days; };
        }

        self.today = new Period('today', 0);
        self.fourWeeks = new Period('four_weeks', 28);
        self.twelveWeeks = new Period('twelve_weeks', 84);

        var periods = [self.today, self.fourWeeks, self.twelveWeeks];
        var periodTexts = [self.today.toString(), self.fourWeeks.toString(), self.twelveWeeks.toString()];

        self.parse = function(period) {
            log.debug(periods);
            log.debug(periodTexts);
            return periods[periodTexts.indexOf(period)];
        };
    }
})();