/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('maintenance', { title: 'ejs' });
};

exports.partials = function (req, res) {
    var name = req.params.name;
    var dir = req.params.dir;
    res.render(dir + "/" + name);
};