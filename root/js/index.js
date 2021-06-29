firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        var uid = user.uid;
        window.location.replace("https://educationisttutoring.org/")
    }
    else {
        window.location.replace("https://dashboard.educationisttutoring.org/login")
    }
});