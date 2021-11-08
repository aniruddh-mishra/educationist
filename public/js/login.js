function login() {
    document.getElementById('container').classList.add('blur')
    document
        .getElementById('loader-container')
        .classList.replace('loader-none', 'loader-container')
    var eid = document.getElementById('eid').value
    var password = document.getElementById('password').value
    if (eid == '' || password == '') {
        document.getElementById('container').classList.remove('blur')
        document
            .getElementById('loader-container')
            .classList.replace('loader-container', 'loader-none')
        document.getElementById('error').classList.add('error')
        document.getElementById('error').innerHTML = 'All fields are required'
        if (eid == '') {
            document.getElementById('eid').classList = 'error-decorator'
        }
        if (password == '') {
            document.getElementById('password').classList = 'error-decorator'
        }
        return
    }
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/login', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            eid: eid,
        })
    )
    xhr.onload = function () {
        var email = this.response
        if (email == 'false') {
            document.getElementById('container').classList.remove('blur')
            document
                .getElementById('loader-container')
                .classList.replace('loader-container', 'loader-none')
            document.getElementById('error').classList.add('error')
            document.getElementById('error').innerHTML =
                'Wrong username or password'
            console.log('Wrong Password')
            return
        }
        firebase
            .auth()
            .signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                localStorage.setItem('eid', eid)
            })
            .catch((error) => {
                document.getElementById('container').classList.remove('blur')
                document
                    .getElementById('loader-container')
                    .classList.replace('loader-container', 'loader-none')
                document.getElementById('error').classList.add('error')
                document.getElementById('error').innerHTML =
                    'Wrong username or password'
                console.log('Wrong Password')
            })
    }
}

function validate(value) {
    password = validatePassword(value)
    eid = validateEid(value)
    error = document.getElementById('error')
    if (password && eid && error.innerHTML == 'All fields are required') {
        error.innerHTML = '‏‏‎ '
    }
}

function validatePassword(check) {
    var password = document.getElementById('password')
    if (password.value != '') {
        if (check === 'password') {
            password.classList = ''
        }
        return true
    }
    if (password.value == '') {
        if (check === 'password') {
            password.classList = 'error-decorator'
        }
        return
    }
}

function validateEid(check) {
    var eid = document.getElementById('eid')
    if (eid.value != '') {
        if (check === 'eid') {
            eid.classList = ''
        }
        return true
    }
    if (eid.value == '') {
        if (check === 'eid') {
            eid.classList = 'error-decorator'
        }
        return
    }
}
