// Login function
function login() {
    // Configures screen to show loading
    document.getElementById('container').classList.add('blur')
    document
        .getElementById('loader-container')
        .classList.replace('loader-none', 'loader-container')

    // Gets the values of eid and password
    var eid = document.getElementById('eid').value
    var password = document.getElementById('password').value

    // Ensures fields are filled in
    if (eid == '' || password == '') {
        // Removes loading configurations
        document.getElementById('container').classList.remove('blur')
        document
            .getElementById('loader-container')
            .classList.replace('loader-container', 'loader-none')

        // Adds error message
        document.getElementById('error').classList.add('error')
        document.getElementById('error').innerHTML = 'All fields are required'

        // Highlights fields in red
        if (eid == '') {
            document.getElementById('eid').classList = 'error-decorator'
        }

        if (password == '') {
            document.getElementById('password').classList = 'error-decorator'
        }

        return
    }

    // Requests email from server
    // Creates request instance
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/login', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            eid: eid,
        })
    )
    xhr.onload = function () {
        // Receives email from server based on eid
        var email = this.response

        // If eid was invalid
        if (email == 'false') {
            // Removes loading configurations
            document.getElementById('container').classList.remove('blur')
            document
                .getElementById('loader-container')
                .classList.replace('loader-container', 'loader-none')

            // Adds error messages
            document.getElementById('error').classList.add('error')
            document.getElementById('error').innerHTML =
                'Wrong username or password'

            return
        }

        // Authorizes if email is returned
        firebase
            .auth()
            .signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Sets localstorage with user info if logged in
                localStorage.setItem('eid', eid)
                localStorage.setItem('uid', userCredential.user.uid)
            })
            .catch((error) => {
                // Removes loading configurations
                document.getElementById('container').classList.remove('blur')
                document
                    .getElementById('loader-container')
                    .classList.replace('loader-container', 'loader-none')

                // Adds error messages
                document.getElementById('error').classList.add('error')
                document.getElementById('error').innerHTML =
                    'Wrong username or password'
            })
    }
}

function validate(value) {
    // Validates fields after each key up
    password = validatePassword(value)
    eid = validateEid(value)
    error = document.getElementById('error')

    if (password && eid && error.innerHTML == 'All fields are required') {
        // Removes error message and replaces with invisible character
        error.innerHTML = '‏‏‎ '
    }
}

function validatePassword(check) {
    // Gets value of password
    var password = document.getElementById('password')

    // Changes class of password based on if it is empty
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
    // Gets value of eid
    var eid = document.getElementById('eid')

    // Changes class of eid based on if it is empty
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
