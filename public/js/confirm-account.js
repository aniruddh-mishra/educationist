const { token } = require('../../zoho')

function validate(element) {
    if (element.value == '') {
        element.classList.add('error-decorator')
        return false
    }
    var re = /\S+@\S+\.\S+/
    if (element.id === 'email' && !re.test(element.value)) {
        element.classList.add('error-decorator')
        return false
    }
    element.classList.remove('error-decorator')
    return true
}

async function upload() {
    document.getElementById('submit').disabled = true
    var username = validate(document.getElementById('username'))
    var password = validate(document.getElementById('password'))
    var confirmPassword = validate(document.getElementById('password-confirm'))
    if (!(username && password && confirmPassword)) {
        document.getElementById('submit').disabled = false
        return
    }

    username = lowerCase(document.getElementById('username').value.trim())
    password = document.getElementById('password').value
    confirmPassword = document.getElementById('password-confirm').value

    if (password != confirmPassword) {
        token('Both passwords must match')
        document.getElementById('submit').disabled = false
        return
    }

    if (password.length <= 6) {
        token(
            'This password is too short. Make sure to have atleast 6 characters.'
        )
        document.getElementById('submit').disabled = false
        return
    }

    const urlParams = new URLSearchParams(window.location.search)

    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/create', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            code: urlParams.get('confirm'),
            eid: username,
            password: password,
        })
    )
    xhr.onload = function () {
        var confirm = this.response
        if (confirm == 'true') {
            token('Account was successfully created!')
            setTimeout(() => {
                window.location.replace('/login')
            }, 10000)
        } else if (confirm == 'error') {
            token('This confirm token was already used to create an account.')
            setTimeout(() => {
                window.location.replace('/')
            }, 5000)
        } else if (confirm == 'false') {
            token('This username is already used!')
            document.getElementById('submit').disabled = false
        } else if (confirm == 'expire') {
            token('This token expired. Please try to create an account again!')
            setTimeout(() => {
                window.location.replace('/register')
            }, 5000)
        } else {
            token('Something went wrong: ', confirm)
        }
    }
}

const form = document.getElementById('register')
function handleForm(event) {
    event.preventDefault()
}
form.addEventListener('submit', handleForm)
