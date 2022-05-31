const userInfo = {
    registration: firebase.firestore.Timestamp.fromMillis(timeStamp.getTime()),
    email: data.email.charAt(0).toLowerCase() + data.email.slice(1),
    name: data.name,
    eid: eid,
    role: data.role,
    birthday: firebase.firestore.Timestamp.fromMillis(birthday.getTime()),
    timezone: data.timezone,
}
