const express = require('express');
const fs = require('fs');

const app = express();

app.get('/', (request, response) => {
    response.sendFile(__dirname + '/root/index.html');
});

app.get('/login', (request, response) => {
    response.sendFile(__dirname + '/root/login.html');
});

app.get('/testing/availabilities', (request, response) => {
    response.sendFile(__dirname + '/root/availabilities.html');
});

app.get('/css', (request, response) => {
    const fileName = request.query.file;
    if (fileName) {
        var file = __dirname + '/root/css/' + fileName
        if (fs.existsSync(file) == false) {
            response.status(404).send("We could not find that file!")
        }
        response.sendFile(file)
        return
    }
    response.status(500).send("Missing query!")
});

app.get('/js', (request, response) => {
    const fileName = request.query.file;
    if (fileName) {
        var file = __dirname + '/root/js/' + fileName
        if (fs.existsSync(file) == false) {
            response.status(404).send("We could not find that file!")
        }
        response.sendFile(file)
        return
    }
    response.status(404).send("We could not find that file!")
});

app.get('/donate', function(request, response) {
    response.sendFile(__dirname + '/root/donate.html');
});

app.post('/donate', function(request, response) {
    const itemsJson = JSON.parse(data)
    const itemsArray = itemsJson.music.concat(itemsJson.merch)
    let total = 0
    req.body.items.forEach(function(item) {
        const itemJson = itemsArray.find(function(i) {
        return i.id == item.id
        })
        total = total + itemJson.price * item.quantity
    })

    stripe.charges.create({
        amount: total,
        source: req.body.stripeTokenId,
        currency: 'usd'
    }).then(function() {
        console.log('Charge Successful')
        res.json({ message: 'Successfully purchased items' })
    }).catch(function() {
        console.log('Charge Fail')
        res.status(500).end()
    })
});

app.listen(80, () => console.log('App available on https://dashboard.educationisttutoring.org'))