// Imports Libraries
const fs = require('fs')
require('dotenv').config({
    path: __dirname + '/.env',
})

// Defines the runtime as development or production
module.exports.processURL =
    process.env.DEPLOYMENT === 'production'
        ? 'https://dashboard.educationisttutoring.org'
        : 'https://good-bird-23.telebit.io'
