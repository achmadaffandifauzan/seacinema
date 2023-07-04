const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport');
const User = require('../models/user');
const Cart = require('../models/cart');
const Transaction = require('../models/transaction');

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
    res.render('movies/show', { movie, indexArray });
}))
router.post('/movies/:id/addcart', isLoggedIn, getMovies, catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    const moviesArr = res.locals.moviesArr;
    var cart = await Cart.findOne({ author: user._id, title: moviesArr[req.params.id].title })
    if (!cart) {
        var cart = new Cart({ author: user, movieIndexInArray: parseInt(req.params.id), title: moviesArr[req.params.id].title, quantity: parseInt(req.body.quantity) })
        user.carts = [];
        user.carts.push(cart);
        await user.save();
        await cart.save();
    } else {
        cart.quantity += parseInt(req.body.quantity);
        await cart.save();
    }
    req.flash('success', "Successfully added to cart!");
    res.redirect('/movies');
}))
module.exports = router;