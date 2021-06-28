document.getElementById('loginButton').addEventListener('click', login);

function login() {
    document.getElementById("container").classList.add("blur")
    document.getElementById("loader").classList.add("loader")
    var eid = document.getElementById('eid').value;
    var password = document.getElementById('password').value;
    if(eid == "" || password == "") {
        document.getElementById("container").classList.remove("blur")
        document.getElementById("loader").classList.remove("loader")
        document.getElementById("error").classList.add("error")
        document.getElementById("error").innerHTML = "All fields are required"
        if (eid == "") {
            document.getElementById("eid-decorator").classList.add("error-decorator")
            document.getElementById("eid-decorator").classList.remove("input-decorator")
        }
        if (password == "") {
            document.getElementById("password-decorator").classList.add("error-decorator")
            document.getElementById("password-decorator").classList.remove("input-decorator")
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
            document.getElementById("loader").classList.remove("loader")
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
            document.getElementById("loader").classList.remove("loader")
        });
    }
}

function validate(value) {
    if (value == "password") {
        var decorator = document.getElementById("password-decorator")
        var password = document.getElementById("password")
        if (decorator.classList.contains("error-decorator")) {
            if (password.value != "") {
                decorator.classList.remove("error-decorator")
                decorator.classList.add("input-decorator")
            }
        }
        else {
            if (password.value == "") {
                console.log("added")
                decorator.classList.add("error-decorator")
                decorator.classList.remove("input-decorator")
            }
        }
        return
    }
    var decorator = document.getElementById("eid-decorator")
    var eid = document.getElementById("eid")
    if (decorator.classList.contains("error-decorator")) {
        if (eid.value != "") {
            decorator.classList.remove("error-decorator")
            decorator.classList.add("input-decorator")
        }
    }
    else {
        if (eid.value == "") {
            console.log("added")
            decorator.classList.add("error-decorator")
            decorator.classList.remove("input-decorator")
        }
    }
}