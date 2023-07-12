const express = require('express');
const router = express.Router({ mergeParams: true });
const User = require('../models/User');
const Cart = require('../models/cart');
const catchAsync = require('../utils/CatchAsync');
const { isLoggedIn, reqBodySanitize, getMovies } = require('../middleware');



router.get('/movies', getMovies, catchAsync(async (req, res, next) => {
    const query = req.query.q
    const moviesArr = res.locals.moviesArr; // needed, since i use ID from the index of the movies inside this array
    if (query) {
        const myReg = new RegExp(query, "i");
        var searchResult = res.locals.moviesArr.filter(obj => {
            if (myReg.test(obj.title) == true || myReg.test(obj.description) == true) {
                return obj;
            }
        })
    }
    // console.log(moviesArr);
    res.render('movies/index', { moviesArr, query, searchResult });
}))
router.get('/movies/:id', getMovies, catchAsync(async (req, res, next) => {
    const movie = res.locals.moviesArr[req.params.id];
    const indexArray = req.params.id;
    res.render('movies/show', { movie, indexArray });
}))
router.post('/movies/:id/addcart', reqBodySanitize, isLoggedIn, getMovies, catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    const moviesArr = res.locals.moviesArr;
    if (user.age < moviesArr[req.params.id].age_rating) {
        req.flash('error', `You can't buy this ticket, the minimum age is ${moviesArr[req.params.id].age_rating} to bought this ticket!`);
        return res.redirect('/movies');
    }
    if (parseInt(req.body.quantity) > 6) {
        req.flash('error', `The maximum number of tickets that can be booked in
        one transaction is 6 tickets`);
        return res.redirect('/movies');
    };
    var cart = await Cart.findOne({ author: user._id, title: moviesArr[req.params.id].title })
    if (!cart) {
        var cart = new Cart({
            author: user,
            movieIndexInArray: parseInt(req.params.id),
            quantity: parseInt(req.body.quantity),
            title: moviesArr[req.params.id].title,
            description: moviesArr[req.params.id].description,
            release_date: moviesArr[req.params.id].release_date,
            poster_url: moviesArr[req.params.id].poster_url,
            age_rating: moviesArr[req.params.id].age_rating,
            ticket_price: moviesArr[req.params.id].ticket_price,
        })
        user.carts.push(cart);
        await user.save();
        await cart.save();
    } else {
        if (cart.quantity += parseInt(req.body.quantity) > 6) {
            req.flash('error', `The maximum number of tickets that can be booked in
            one transaction is 6 tickets`);
            return res.redirect('/movies');
        };
        cart.quantity += parseInt(req.body.quantity);
        await cart.save();
    }

    req.flash('success', "Successfully added to cart!");
    res.redirect('/movies');
}))
module.exports = router;