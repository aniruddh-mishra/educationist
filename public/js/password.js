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
        document.querySelector('body').style.display = 'none'
        document.querySelector('body').innerHTML =
            this.response + document.querySelector('body').innerHTML
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
            const mode = localStorage.getItem('lightmode')
            if (mode === 'true') {
                document.getElementById('lightmode-btn').innerHTML = 'Dark Mode'
                var cssRoot = document.querySelector(':root')
                const lightMode = {
                    '--background': 'white',
                    '--basic-font': 'black',
                    '--invert': 'rgb(92, 90, 90)',
                    '--background-standout': '#89cab6',
                    '--background-block': 'rgb(30, 34, 32)',
                    '--background-block-hover': 'rgb(37, 41, 39)',
                    '--help-menu': 'var(--background-block)',
                }
                document
                    .getElementById('theme')
                    .setAttribute('content', 'white')
                document
                    .getElementById('logo-img')
                    .setAttribute(
                        'src',
                        'https://cdn.educationisttutoring.org/images/dark-logos/educationist.png'
                    )
                for (key of Object.keys(lightMode)) {
                    cssRoot.style.setProperty(key, lightMode[key])
                }
            }
        }
        document.head.appendChild(s)
    }
}
