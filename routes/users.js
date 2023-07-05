const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport');
const User = require('../models/user');
const Cart = require('../models/cart');
const BookedTicket = require('../models/bookedTicket');
const BookedSeat = require('../models/bookedSeat');
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
        newUser.balance = 0;
        newUser.totalCartValue = 0;
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
    if (req.params.id != req.user._id) {
        req.flash('error', "You don't have access to do that!");
        return res.redirect('/movies');
    };
    const user = await User.findById(req.params.id);
    res.render('users/topup', { user });
}))
router.post('/users/:id/topup', isLoggedIn, catchAsync(async (req, res, next) => {
    if (req.params.id != req.user._id) {
        req.flash('error', "You don't have access to do that!");
        return res.redirect('/movies');
    };
    const user = await User.findById(req.params.id);
    if (!req.body.topup_amount) {
        req.flash('error', "Minimum topup is Rp 1,00!");
        res.redirect(`/users/${user._id}/topup`);
    }
    if (user.balance) {
        user.balance += parseInt(req.body.topup_amount);
    } else {
        user.balance = parseInt(req.body.topup_amount);
    }
    await user.save();
    req.flash('success', "Successfully top up your balance!");
    res.redirect(`/users/${user._id}/topup`);
}))
router.get('/users/:id/withdraw', isLoggedIn, catchAsync(async (req, res, next) => {
    if (req.params.id != req.user._id) {
        req.flash('error', "You don't have access to do that!");
        return res.redirect('/movies');
    };
    const user = await User.findById(req.params.id);
    res.render('users/withdraw', { user });
}))
router.post('/users/:id/withdraw', isLoggedIn, catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (req.params.id != req.user._id) {
        req.flash('error', "You don't have access to do that!");
        return res.redirect('/movies');
    } else if (!user.balance || user.balance < 1) {
        req.flash('error', "Your balance is Rp 0,00!");
        return res.redirect(`/users/${req.params.id}/topup`);
    } else if (!req.body.withdraw_amount || parseInt(req.body.withdraw_amount) > 500000 || parseInt(req.body.withdraw_amount) < 1) {
        req.flash('error', "Minimum withdraw is Rp 1,00 and maximum withdraw is Rp 500.000,00 !");
        return res.redirect(`/users/${req.params.id}/withdraw`);
    } else if (parseInt(req.body.withdraw_amount) > user.balance) {
        req.flash('error', "It's more than your balance!");
        return res.redirect(`/users/${req.params.id}/withdraw`);
    }

    user.balance -= parseInt(req.body.withdraw_amount);
    await user.save();
    req.flash('success', "Successfully top up your balance!");
    res.redirect(`/users/${user._id}/topup`);
}))
router.get('/users/:id/cart', isLoggedIn, getMovies, catchAsync(async (req, res, next) => {
    if (req.params.id != req.user._id) {
        req.flash('error', "You don't have access to do that!");
        return res.redirect('/movies');
    };
    const user = await User.findById(req.params.id).populate('carts');
    const carts = user.carts;
    const movies = res.locals.moviesArr;
    let total = 0;
    for (let movie of carts) {
        total += movie.quantity * parseInt(movies[movie.movieIndexInArray].ticket_price);
    }
    user.totalCartValue = total;
    await user.save();


    const cartsTitles = [];
    for (let cart of carts) {
        cartsTitles.push(cart.title);
    }
    const bookedTickets = await BookedTicket.find({
        'title': { $in: cartsTitles }
    })

    res.render('users/cart', { user, movies, carts, bookedTickets, cartsTitles });
}))

router.post('/users/:id/checkout', isLoggedIn, getMovies, catchAsync(async (req, res, next) => {
    if (req.params.id != req.user._id) {
        req.flash('error', "You don't have access to do that!");
        return res.redirect('/movies');
    };
    const user = await User.findById(req.params.id).populate('carts');
    if (user.carts.length > 6) {
        req.flash('error', 'The maximum number of tickets that can be booked in one transaction is 6 tickets');
        return res.redirect(`/users/${user._id}/cart`);
    };
    const movies = res.locals.moviesArr;
    let total = 0;
    for (let movie of user.carts) {
        total += movie.quantity * parseInt(movies[movie.movieIndexInArray].ticket_price);
    }
    user.totalCartValue = total;
    await user.save();

    if (user.totalCartValue > user.balance) {
        req.flash('error', `You need Rp ${user.totalCartValue - user.balance},00 more to do the transaction!`);
        return res.redirect(`/users/${user._id}/cart`);
    };



    // seat checking (checking EVERY movies seat availibilty before executing ANY of the transactions)
    for (let movie of user.carts) {
        const bookedTicket = await BookedTicket.findOne({ title: movie.title })
        // only check seats of this movie if bookedTicket exist
        if (bookedTicket) {
            for (let seatNum of req.body.seatNumber[`${movie.title}`]) {
                if (!bookedTicket.availableSeats.includes(parseInt(seatNum))) {
                    req.flash('error', "This seat has been reserved");
                    return res.redirect(`/users/${user._id}/cart`);
                }
                bookedTicket.availableSeats.splice(parseInt(seatNum) - 1);
            }
        }
    }

    // below here is the success case
    const allSeats = Array.from({ length: 64 }, (value, index) => index + 1);
    for (let movie of user.carts) {
        var bookedTicket = await BookedTicket.findOne({ title: movie.title })
        // if this movie title never been created in db (was never booked before)
        if (!bookedTicket) {
            var bookedTicket = new BookedTicket({ title: movie.title });
            bookedTicket.availableSeats = allSeats;
        };
        for (let seatNum of req.body.seatNumber[`${movie.title}`]) {
            bookedTicket.availableSeats.splice(parseInt(seatNum) - 1);
        }
        // creating bookedSeat object on every bookedTicket object on every movie in user.carts
        for (let seatNum of req.body.seatNumber[`${movie.title}`]) {
            const bookedSeat = new BookedSeat({
                user: req.user._id,
                fromBookedTicket: bookedTicket,
                seatNumber: seatNum,
                status: 'ongoing'
            })
            bookedTicket.bookedSeats.push(bookedSeat);
            await bookedSeat.save();
        }
        await bookedTicket.save();
        user.ongoingTickets.push(bookedTicket);
    }
    user.balance -= user.totalCartValue;
    user.totalCartValue = 0;
    user.carts = [];
    await user.save();

    req.flash('success', "Tickets successfully booked!");
    res.redirect(`/users/${user._id}/cart`);
}))


module.exports = router;