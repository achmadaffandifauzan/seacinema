const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport');
const User = require('../models/User');
const catchAsync = require('../utils/CatchAsync');
const { isLoggedIn, isGuest, validateUser, reqBodySanitize } = require('../middleware');
const ExpressError = require('../utils/ExpressError');
const dayjs = require('dayjs');

const axios = require('axios');

router.get('/movies', catchAsync(async (req, res, next) => {
    const moviesArr = await axios.get('https://seleksi-sea-2023.vercel.app/api/movies')
        .then(function (response) {
            return response.data
        })
        .catch(function (error) {
            console.log(error);
        })
        .finally(function () {
            // always executed
        });
    res.render('movies/index', { moviesArr })
}))

module.exports = router;