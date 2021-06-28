const express = require('express');
const fs = require('fs')

const app = express();

app.get('/login', (request, response) => {
    console.log(request.ip)
    readFile('./root/login.html', 'utf8', (err, html) => {
        if (err) {
            response.status(500).send(err);
        }

        response.send(html);
    })
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

app.listen(80, () => console.log('App available on https://dashboard.educationisttutoring.org'))