(function () {
    'use strict';

    var container = require('../container.js')('config.json');

    var designDocumentsUpdater = container.get('designDocumentsUpdater');
    var userPreferencesUpdater = container.get('userPreferencesUpdater');

    designDocumentsUpdater.update()
        .then(userPreferencesUpdater.update)
        .done();

})();