const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport');
const User = require('../models/User');
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

module.exports = router;