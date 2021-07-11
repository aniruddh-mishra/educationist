const dbRef = firebase.database().ref();
var content = {}
refresh()

function refresh() {
    dbRef.child("Content Catalog").get().then((data) => {
    if (data.exists()) {
        content = data.val();
    } else {
        console.log("No data available");
    }
    }).catch((error) => {
    console.error(error);
    });
}