const fs = require('fs');

module.exports.Respond = class Respond {
    constructor(response) {
        this.code = 200
        this.responder = response
    }

    status(code) {
        this.code = code
        return this
    }

    send(data) {
        this.responder.setHeader("Cache-Control", "public, max-age=1");
        this.responder.setHeader("Expires", new Date(Date.now() + 1).toUTCString());
        this.responder.status(this.code).send(data)
    }

    sendFile(filename) {
        this.responder.sendFile(filename)
    }
}