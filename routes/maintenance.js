/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('maintenance', { title: 'ejs' });
};