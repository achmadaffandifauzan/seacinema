const { userSchema } = require("./joiSchemas");
const User = require('./models/User');
const catchAsync = require('./utils/CatchAsync');
const ExpressError = require('./utils/ExpressError');
const sanitizeHtml = require('sanitize-html');


module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', "You're not logged in!");
        return res.redirect('/login');
    }
    return next();
}
module.exports.isGuest = (req, res, next) => {
    if (req.isAuthenticated()) {
        req.flash('error', "You're still logged in!");
        return res.redirect('/posts');
    }
    return next();
}
module.exports.validateUser = (req, res, next) => {
    const { error } = userSchema.validate(req.body);
    if (error) {
        // mapping error(s) then joining them to single array of single string
        const messageErr = error.details.map(x => x.message).join(',');
        throw new ExpressError(messageErr, 400);
    } else {
        return next();
    }
}
module.exports.reqBodySanitize = (req, res, next) => {
    for (var key in req.body) {
        if (req.body.hasOwnProperty(key)) {
            let value = sanitizeHtml(req.body[key])
            req.body[key] = value;
        }
    }
    return next();
}