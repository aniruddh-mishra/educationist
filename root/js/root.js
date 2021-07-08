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

function openMenu(value) {
    value.classList.toggle('change');
    document.getElementsByClassName('title')[0].classList.toggle('invisible')
    document.getElementsByClassName('main-body')[0].classList.toggle('invisible')
}