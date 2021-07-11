var firebaseConfig = {
    apiKey: "AIzaSyDf83xltbEW7NoN1PezsCgmtTQesxknfbM",
    authDomain: "educationist-42b45.firebaseapp.com",
    databaseURL: "https://educationist-42b45-default-rtdb.firebaseio.com",
    projectId: "educationist-42b45",
    storageBucket: "educationist-42b45.appspot.com",
    messagingSenderId: "842761677930",
    appId: "1:842761677930:web:a4c21f30788d79cc7cae13",
    measurementId: "G-MQ60CQZ0TH"
};
firebase.initializeApp(firebaseConfig);

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        if (localStorage.getItem("eid") === null) {
            window.location.replace("/logout")
        }
        if (window.location.pathname === "/login") {
            const params = new URLSearchParams(window.location.search)
            if (params.has("path")) {
                window.location.replace(params.get("path"))
                return
            }
            window.location.replace("/")
        }
    }
    else {
        if (window.location.pathname !== "/login") {
            if (window.location.pathname !== "/logout") {
                if (window.location.pathname === "/donate") {
                    alert("You are not signed in! Any donations made will not be attached to your Educationist account.")
                    return
                }
                if (window.location.pathname === "/reset") {
                    return
                }
                window.location.replace("/login?path=" + window.location.pathname)
                return
            }
            window.location.replace("/login")
        }
    }
});

function openMenu(value) {
    value.classList.toggle('change');
    document.getElementsByClassName('title')[0].classList.toggle('invisible')
    document.getElementsByClassName('main-body')[0].classList.toggle('invisible')
}

function accountPage() {
    var user = firebase.auth().currentUser;
    if (user) {
        window.location.replace("/")
    } else {
        window.location.replace("/login")
    }
}