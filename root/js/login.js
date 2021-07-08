function login() {
    document.getElementById("container").classList.add("blur")
    document.getElementById("loader-container").classList.replace("loader-none", "loader-container")
    var eid = document.getElementById('eid').value;
    var password = document.getElementById('password').value;
    if(eid == "" || password == "") {
        document.getElementById("container").classList.remove("blur")
        document.getElementById("loader-container").classList.replace("loader-container", "loader-none")
        document.getElementById("error").classList.add("error")
        document.getElementById("error").innerHTML = "All fields are required"
        if (eid == "") {
            document.getElementById("eid").classList = ("error-decorator")
        }
        if (password == "") {
            document.getElementById("password").classList = ("error-decorator")
        }
        return
    }
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://mainframe.educationisttutoring.org/login", true);
    xhr.send(JSON.stringify({
        eid: eid, password: password
    }));
    xhr.onload = function() {
        var token = this.response;
        if(token == "false") {
            document.getElementById("container").classList.remove("blur")
            document.getElementById("loader-container").classList.replace("loader-container", "loader-none")
            document.getElementById("error").classList.add("error")
            document.getElementById("error").innerHTML = "Wrong username or password"
            console.log("Wrong Password")
            return
        }
        firebase.auth().signInWithCustomToken(token)
        .then((userCredential) => {
            var user = userCredential.user;
            window.location.replace("https://educationisttutoring.org")
        })
        .catch((error) => {
            var errorMessage = error.message;
            console.log(errorMessage)
            alert("There was an error, please try again later.")
            document.getElementById("container").classList.remove("blur")
            document.getElementById("loader-container").classList.replace("loader-container", "loader-none")
        });
    }
}

function validate(value) {
    password = validatePassword(value)
    eid = validateEid(value)
    error = document.getElementById("error")
    if (password && eid && error.innerHTML == "All fields are required") {
        error.innerHTML = "‏‏‎ "
    }
}

function validatePassword(check) {
    var password = document.getElementById("password")
    if (password.value != "") {
        if (check === "password") {
            password.classList = ""
        }
            return true
    }
    if (password.value == "") {
        if (check === "password") {
            password.classList = "error-decorator"
        }
        return
    }
}

function validateEid(check) {
    var eid = document.getElementById("eid")
    if (eid.value != "") {
        if (check === "eid") {
            eid.classList = ""
        }
        return true
    }
    if (eid.value == "") {
        if (check === "eid") {
            eid.classList = "error-decorator"
        }
        return
    }
}

function openMenu(value) {
    value.classList.toggle('change');
    document.getElementsByClassName('title')[0].classList.toggle('invisible')
    document.getElementsByClassName('login-box')[0].classList.toggle('invisible')
}