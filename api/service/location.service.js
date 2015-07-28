module.exports = LocationService;

LocationService.$inject = ['plugins', 'locations'];

function LocationService(plugins, locations) {
    var self = this;
    var q = plugins.q;

    self.all = function () {
        return locations.byName().then(function (results) {
            return results.sort(function (a, b) {
                return a.order - b.order;
            }).map(function (result) {
                return {
                    id: result._id,
                    name: result.name
                }
            })
        });
    }

    self.findById = function (id) {
        return locations.byId(id).then(function (results) {
            return results.map(function (result) {
                return {
                    id: result._id,
                    name: result.name
                }
            })
        });
    }
}