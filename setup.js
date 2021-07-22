const fs = require('fs');
require('dotenv').config({
    path: __dirname + '/.env'
});

module.exports.secretKeys = {
    donate: {
        keys: [{
            name: 'STRIPE_KEY',
            key: process.env.STRIPE_PUBLIC
        }]
    },
    root: {
        keys: [{
            name: 'NAVIGATION',
            key: fs.readFileSync(__dirname + '/root/navBar.html', 'utf8')
        }]
    }
}

module.exports.processURL = process.env.DEPLOYMENT === 'production' ? 'https://dashboard.educationisttutoring.org' : 'http://localhost'