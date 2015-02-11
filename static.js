/**
 * Module dependencies
 */
try {

var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    morgan = require('morgan'),
    maintenance = require('./routes/maintenance.js'),
    https = require('https'),
    path = require('path'),
    fs = require('fs'),
    favicon = require('serve-favicon');

var app = module.exports = express();

var container = require('./api/container.js')('config.json');
var config = container.get('config');

/**
 * Configuration
 */

app.set('port', process.env.PORT || config.server.port);
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon("public/favicon.ico"));

/**
 * Routes
 */

var options = {
    key: fs.readFileSync(__dirname + "/ssl/key.pem"),
    cert: fs.readFileSync(__dirname + "/ssl/cert.pem")
};

// redirect all request to the static page (HTML5 history)
app.get('*', maintenance.index);


/**
 * Start Server
 */

https.createServer(options, app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

} catch (err) {
    console.log(err);
    throw err;
}
