const { userSchema } = require("./joiSchemas");
const User = require('./models/user');
const catchAsync = require('./utils/CatchAsync');
const ExpressError = require('./utils/ExpressError');
const sanitizeHtml = require('sanitize-html');
const axios = require('axios');

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

        return res.redirect('/');
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
module.exports.getMovies = catchAsync(async (req, res, next) => {
    if (!res.locals.moviesArr) {
        res.locals.moviesArr = await axios.get('https://seleksi-sea-2023.vercel.app/api/movies')
            .then(function (response) {
                return response.data
            })
            .catch(function (error) {
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    }
    next()
})