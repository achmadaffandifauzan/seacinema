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


router.get('/register', isGuest, (req, res) => {
    res.render('users/register');
})
router.post('/register', isGuest, validateUser, catchAsync(async (req, res, next) => {
    try {
        const { name, email, username, age, password } = req.body.user;
        const newUser = new User({ email, age, username, name });
        const registeredUser = await User.register(newUser, password);
        const currentTime = dayjs().format("HH:mm");
        const currentDate = dayjs().format("D MMM YY");
        newUser.dateCreated = `${currentTime} - ${currentDate}`;
        await newUser.save();
        req.login(registeredUser, (error) => {
            if (error) return next(error);
            req.flash('success', 'Successfully Registered!');
            res.redirect('/movies');
        })
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/register');
    }
}));
router.get('/login', isGuest, (req, res) => {
    res.render('users/login');
})
router.post('/login', isGuest, passport.authenticate('local',
    { failureFlash: true, failureRedirect: '/login', keepSessionInfo: true }),
    catchAsync(async (req, res, next) => {
        req.flash('success', "You're Logged In!");
        const redirectUrl = req.session.lastPath || '/movies';
        delete req.session.lastPath;
        res.redirect(redirectUrl);
    }));

router.get('/logout', isLoggedIn, catchAsync(async (req, res, next) => {
    req.logout((error) => {
        if (error) return next(error)
        req.flash('success', "You're Logged Out!");
        res.redirect('/movies');
    });
}))

router.get('/users/:id/topup', isLoggedIn, catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    res.render('users/topup', { user });
}))
router.post('/users/:id/topup', isLoggedIn, catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (req.body.topup_amount) {
        if (user.balance) {
            user.balance += parseInt(req.body.topup_amount);
        } else {
            user.balance = parseInt(req.body.topup_amount);
        }
        await user.save();
    }
    req.flash('success', "Successfully top up your balance!");
    res.redirect(`/users/${user._id}/topup`);
}))

router.get('/users/:id/cart', isLoggedIn, getMovies, catchAsync(async (req, res, next) => {
    if (req.params.id != req.user._id) {
        req.flash('error', "You don't have access to do that!");
        return res.redirect('/movies');
    }
    const user = await User.findById(req.params.id);
    console.log(user._id)
    const carts = await Cart.find({ author: user._id });
    console.log(carts)
    const movies = res.locals.moviesArr;
    let total = 0;
    for (let movie of carts) {
        total += movie.quantity * parseInt(movies[movie.movieIndexInArray].ticket_price);
    }
    user.totalCartValue = total;
    await user.save();
    res.render('users/cart', { user, movies, carts });
}))

router.post('/users/:id/checkout', isLoggedIn, getMovies, catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    const movies = res.locals.moviesArr;
    res.render('users/cart', { user, movies });
}))


module.exports = router;