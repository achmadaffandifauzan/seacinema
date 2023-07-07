const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport');
const User = require('../models/User');
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

    const cartMovieTitles = carts.map((cart) => { return cart.title });
    // finding every booked movie in cart
    const bookedTickets = await BookedTicket.find({
        'title': { $in: cartMovieTitles }
    })
    const bookedTicketsTitles = bookedTickets.map((bookedTicket) => { return bookedTicket.title });
    // console.log(bookedTicketsTitles)
    // console.log(cartMovieTitles)
    // console.log(bookedTickets)
    res.render('users/cart', { user, movies, carts, bookedTickets, cartMovieTitles, bookedTicketsTitles });
}))
router.get('/users/:id/cart/:cartId/delete', isLoggedIn, catchAsync(async (req, res, next) => {
    if (req.params.id != req.user._id) {
        req.flash('error', "You don't have access to do that!");
        return res.redirect('/movies');
    };
    await Cart.findByIdAndDelete(req.params.cartId);
    await User.findOneAndUpdate({ _id: req.user._id }, { $pull: { carts: req.params.cartId } });

    req.flash('success', "Successfully removed item from cart!");
    return res.redirect(`/users/${req.user._id}/cart`)
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
                };
            }
        }
        // check if user fill in same seats on different tickets
        for (let seatNum of req.body.seatNumber[`${movie.title}`]) {
            //https://stackoverflow.com/questions/13389398/finding-out-how-many-times-an-array-element-appears
            // console.log(req.body.seatNumber[`${movie.title}`].filter(item => item == seatNum).length)
            if (req.body.seatNumber[`${movie.title}`].filter(item => item == seatNum).length > 1) {
                req.flash('error', "Please fill in different seats on different tickets");
                return res.redirect(`/users/${user._id}/cart`);
            }
        };
    }

    const currentTime = dayjs().format("HH:mm");
    const currentDate = dayjs().format("D MMM YY");

    // below here is the success case
    const allSeats = Array.from({ length: 64 }, (value, index) => index + 1);
    for (let movie of user.carts) {
        var bookedTicket = await BookedTicket.findOne({ title: movie.title })
        // if this movie title never been created in db (was never booked before)
        if (!bookedTicket) {
            var bookedTicket = new BookedTicket({
                title: movie.title,
                description: movie.description,
                release_date: movie.release_date,
                poster_url: movie.poster_url,
                age_rating: movie.age_rating,
                ticket_price: movie.ticket_price,
            });
            bookedTicket.availableSeats = allSeats;
            await bookedTicket.save();
        };
        for (let seatNum of req.body.seatNumber[`${movie.title}`]) {
            const index = bookedTicket.availableSeats.indexOf(parseInt(seatNum));
            bookedTicket.availableSeats.splice(index, 1);
        }
        // creating bookedSeat object on every bookedTicket object on every movie in user.carts
        for (let seatNum of req.body.seatNumber[`${movie.title}`]) {
            const bookedSeat = new BookedSeat({
                user: req.user._id,
                fromBookedTicket: bookedTicket,
                seatNumber: seatNum,
                status: 'ongoing'
            })
            bookedSeat.datePurchase = `${currentTime} - ${currentDate}`;
            bookedTicket.bookedSeats.push(bookedSeat);
            user.tickets.push(bookedSeat);
            await bookedSeat.save();
        }
        await bookedTicket.save();
    }
    await Cart.deleteMany({ author: user._id });
    user.balance -= user.totalCartValue;
    user.totalCartValue = 0;
    user.carts = [];
    await user.save();

    req.flash('success', "Tickets successfully booked!");
    res.redirect(`/users/${user._id}/tickets`);
}))

router.get('/users/:id/tickets', isLoggedIn, catchAsync(async (req, res, next) => {
    if (req.params.id != req.user._id) {
        req.flash('error', "You don't have access to do that!");
        return res.redirect('/movies');
    };
    const bookedSeatsOngoing = await BookedSeat.find({ user: req.user._id, status: 'ongoing' }).populate('fromBookedTicket');
    const bookedSeatsCancelled = await BookedSeat.find({ user: req.user._id, status: 'cancelled' }).populate('fromBookedTicket');

    res.render('users/tickets', { bookedSeatsOngoing, bookedSeatsCancelled });
}))

router.post('/users/:id/tickets/:bookedSeatId/cancel', isLoggedIn, catchAsync(async (req, res, next) => {
    if (req.params.id != req.user._id) {
        req.flash('error', "You don't have access to do that!");
        return res.redirect('/movies');
    };
    const bookedSeat = await BookedSeat.findById(req.params.bookedSeatId);
    const bookedTicket = await BookedTicket.findById(bookedSeat.fromBookedTicket);
    const user = await User.findById(req.params.id);
    bookedSeat.status = "cancelled";
    bookedTicket.availableSeats.push(bookedSeat.seatNumber);
    user.balance += bookedTicket.ticket_price;
    const currentTime = dayjs().format("HH:mm");
    const currentDate = dayjs().format("D MMM YY");
    bookedSeat.dateCancel = `${currentTime} - ${currentDate}`;
    await bookedSeat.save();
    await bookedTicket.save();
    await BookedTicket.findOneAndUpdate({ _id: bookedTicket._id }, { $pull: { bookedSeats: bookedSeat._id } })
    await user.save();
    req.flash('success', `Successfully cancel ticket booking for ${bookedTicket.title} with number seat of ${bookedSeat.seatNumber}, refunded ${bookedTicket.ticket_price} to your balance!`);
    return res.redirect(`/users/${user._id}/tickets`);
}))
module.exports = router;