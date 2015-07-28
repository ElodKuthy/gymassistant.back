'use strict';

module.exports = Locations;

Locations.$inject = ['coachUtils'];

function Locations(coachUtils) {
    var self = this;
    var get = coachUtils.get;

    self.byId = function (name) {
        return get('_design/locations/_view/byId' + coachUtils.addKey(name));
    }

    self.byName = function (name) {
        return get('_design/locations/_view/byName' + coachUtils.addKey(name));
    }
}