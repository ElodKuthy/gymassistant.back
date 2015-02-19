var express = require('express');
var http = require('http');
var app = express();

app.get('*', function (req,res) {
    res.redirect('https://' + req.hostname + req.url)
});

http.createServer(app).listen(80);