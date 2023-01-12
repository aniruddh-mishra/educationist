// Login function
function login() {
    bufferToggle()

    // Gets the values of eid and password
    var eid = lowerCase(document.getElementById('eid').value.trim())
    var password = document.getElementById('password').value

    // Ensures fields are filled in
    if (eid == '' || password == '') {
        bufferToggle()

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
    request(
        '/login',
        'POST',
        (response) => {
            // Receives email from server based on eid
            var email = response

            // If eid was invalid
            if (email == 'false') {
                signIn(eid, password)
            } else {
                // Authorizes if email is returned
                signIn(email, password)
            }
        },
        {},
        {
            eid: eid,
        }
    )
}

function signIn(email, password) {
    firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then((user) => {
            var uid = user.user.uid
            localStorage.setItem('uid', uid)
        })
        .catch((error) => {
            bufferToggle()

            // Adds error messages
            document.getElementById('error').innerHTML =
                'Wrong username or password'
        })
}

function validate(value) {
    // Validates fields after each key up
    password = validatePassword(value)
    eid = validateEid(value)
    error = document.getElementById('error')

    if (password && eid && error.innerHTML == 'All fields are required') {
        // Removes error message and replaces with invisible character
        error.innerHTML = '&nbsp;'
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
