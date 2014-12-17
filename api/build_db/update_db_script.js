(function () {
    'use strict';

    var container = require('../container.js')('config.json');

    var updater = container.get('designDocumentsUpdater');

    updater.update().done();

})();