function resetPassword() {
    document.getElementById("container").classList.add("blur")
    document.getElementById("loader-container").classList.replace("loader-none", "loader-container")
    const email = document.getElementById("email").value
    console.log(email)
    if (email === "") {
        document.getElementById("container").classList.remove("blur")
        document.getElementById("loader-container").classList.replace("loader-container", "loader-none")
        return
    }
    fetch("/reset", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email
        })
    })
    .then((data) => {
        console.log(data.status)
        if (data.status === 200) {
            document.getElementById("error").innerText = "Check your email for a link to reset your password!"
        } else if (data.status === 400) {
            alert("Something went wrong, please try again later!")
        } else {
            document.getElementById("error").innerText = "This email does not seem to exist in our database. Make sure to use the email you registered with!"
        }
        document.getElementById("container").classList.remove("blur")
        document.getElementById("loader-container").classList.replace("loader-container", "loader-none")
    })
}

function validate() {
    if (document.getElementById("email").value !== "") {
        document.getElementById("email").classList.remove("error-decorator")
    } else {
        document.getElementById("email").classList.add("error-decorator")
    }
}