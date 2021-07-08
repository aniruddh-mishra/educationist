firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        var uid = user.uid;
    }
    else {
        window.location.replace("https://dashboard.educationisttutoring.org/login")
    }
});