var password = ''

const cDecoded = decodeURIComponent(document.cookie)
const cArr = cDecoded.split('; ')
var res
cArr.forEach((val) => {
    if (val.indexOf('admin=') === 0) res = val.substring(6)
})
if (res != undefined) {
    check(res, true)
}

function type(character) {
    password += character
    if (password.length === 16) {
        check(password)
    }
    if (password.length > 16) {
        window.location.replace('/')
    }
}

function check(password, redirect) {
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/admin', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            password: password,
        })
    )
    xhr.onload = function () {
        if (this.response === 'false') {
            if (!redirect) {
                window.location.replace('/')
            } else {
                document.cookie = 'admin=; path=/'
                password = ''
            }
            return
        }
        document.querySelector('body').innerHTML = this.response
        var s = document.createElement('script')
        s.setAttribute('src', '../js/root.js')
        s.onload = function () {
            s = document.createElement('script')
            s.setAttribute('src', '../js/admin.js')
            document.head.appendChild(s)
            var date = new Date()
            date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000)
            const expires = 'expires=' + date.toUTCString()
            document.cookie = 'admin=' + password + '; ' + expires + '; path=/'
        }
        document.head.appendChild(s)
    }
}
