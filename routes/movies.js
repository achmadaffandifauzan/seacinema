const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport');
const User = require('../models/user');
const catchAsync = require('../utils/CatchAsync');
const { isLoggedIn, isGuest, validateUser, reqBodySanitize, getMovies } = require('../middleware');
const ExpressError = require('../utils/ExpressError');
const dayjs = require('dayjs');

const axios = require('axios');



router.get('/movies', getMovies, catchAsync(async (req, res, next) => {
    const moviesArr = res.locals.moviesArr;
    res.render('movies/index', { moviesArr });
}))
router.get('/movies/:id', getMovies, catchAsync(async (req, res, next) => {
    const movie = res.locals.moviesArr[req.params.id];
    const indexArray = req.params.id;
    console.log(movie)
    res.render('movies/show', { movie, indexArray });
}))
router.post('/movies/:id/addcart', isLoggedIn, getMovies, catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    const moviesArr = res.locals.moviesArr;
    if (!user.cart) {
        user.cart = [];
    };
    for (let cart of user.cart) {
        // if movie is already exist in cart
        if (cart.movieName == moviesArr[req.params.id].title) {
            cart.quantity += parseInt(req.body.quantity);
            await user.save();
            req.flash('success', "Successfully added to cart!");
            return res.redirect('/movies');
        }
    }
    user.cart.push({
        movieIndexInArray: parseInt(req.params.id),
        movieName: moviesArr[req.params.id].title,
        quantity: parseInt(req.body.quantity)
    });
    await user.save();
    req.flash('success', "Successfully added to cart!");
    res.redirect('/movies');
}))
module.exports = router;