// Imports Libraries
const fs = require('fs')
require('dotenv').config({
    path: __dirname + '/.env',
})

// Secret keys defined
module.exports.secretKeys = {
    donate: {
        keys: [
            {
                name: 'STRIPE_KEY',
                key: process.env.STRIPE_PUBLIC,
            },
        ],
    },
    root: {
        keys: [
            {
                name: 'NAVIGATION',
                key: fs.readFileSync(
                    __dirname + '/public/pages/navBar.html',
                    'utf8'
                ),
            },
        ],
    },
}

// Defines the runtime as development or production
module.exports.processURL =
    process.env.DEPLOYMENT === 'production'
        ? 'https://dashboard.educationisttutoring.org'
        : 'https://slimy-vampirebat-27.telebit.io'
