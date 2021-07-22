const fs = require('fs');
const {google} = require('googleapis');
const axios = require('axios');

const SCOPES = ['https://www.googleapis.com/auth/admin.directory.user'];
var oauth2Client;

fs.readFile('credentials.json', (err, content) => {
  const {client_secret, client_id, redirect_uris} = JSON.parse(content).web;
  oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris
  );
  newURL(oauth2Client);
});

var userRequest;

function generatePassword() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz"
  var password = ''
  for (let i = 0; i < 10; i++) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)]
    password += String(Math.floor(Math.random() * 10))
  }
  password += '*'
  return password
}

function newURL(oauth2Client) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  console.log('Authorize this app by visiting this url:', authUrl);
}

async function getNewToken(code) {
    const {tokens} = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log(tokens)
    userRequest = axios.create({
      headers: {
        'Authorization': 'Bearer ' + oauth2Client.credentials.access_token,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
}

function makeUser(name, eid, homeEmail) {
  name = 'test tutor 1'
  homeEmail = 'aniruddhm17@gmail.com'
  const firstName = name.split(" ")[0]
  const lastName = name.split(" ").splice(1).join(" ")
  const password = generatePassword()
  const email = firstName + '.' + lastName.replace(' ', '.') + '.' + eid + '@tutors.educationisttutoring.org'
  const userData = {
    name: {
        familyName: lastName,
        givenName: firstName
    },
    password: password,
    primaryEmail: email,
    changePasswordAtNextLogin: true,
    orgUnitPath: "/Tutors",
    emails:
    [{
        address: homeEmail,
        type: "home",
        primary: true
    }]
  }
  userRequest.post('https://admin.googleapis.com/admin/directory/v1/users', userData)
  .then(value => console.log(value))
  .catch(error => console.error(error))
}

function deleteUser(email) {
  userRequest.delete('https://admin.googleapis.com/admin/directory/v1/users/' + email)
}

function changePassword(email) {
  const password = generatePassword()
  console.log(password)
  const data = {
    password: password,
    changePasswordAtNextLogin: true
  }
  userRequest.put('https://admin.googleapis.com/admin/directory/v1/users/' + email, data)
}

module.exports.deleteUser = deleteUser
module.exports.changePassword = changePassword
module.exports.makeUser = makeUser
module.exports.getNewToken = getNewToken