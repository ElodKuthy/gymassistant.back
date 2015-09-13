(function () {
    'use strict';

    var container = require('../container.js')('config.json');

    var designDocumentsUpdater = container.get('designDocumentsUpdater');
    var userPreferencesUpdater = container.get('userPreferencesUpdater');

    return userPreferencesUpdater.update().done();

})();