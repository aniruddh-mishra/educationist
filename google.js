const fs = require('fs');
const {google} = require('googleapis');
const axios = require('axios');
const { sendMail, db, emailError } = require(__dirname + '/emailer.js');
require('dotenv').config({
  path: __dirname + '/.env'
});

const SCOPES = ['https://www.googleapis.com/auth/admin.directory.user'];

// axios.post('http://dashboard.educationisttutoring.org/makeuser', {name: 'Aniruddh Mishra', 'eid': 'mG8Z', email: 'aniruddhm17@gmail.com'})

const {client_secret, client_id, redirect_uris} = JSON.parse(process.env.GOOGLE_CERT).web;
var oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris
);
newURL(oauth2Client);

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

async function newURL(oauth2Client) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  const options = [{
    key: 'link1',
    text: authUrl
  }]
  try {
    await sendMail('aniruddh.mishra@educationisttutoring.org', 'Activate Deployment', __dirname + '/root/emails/activate.html', options)
  } catch (err) {
      console.log("Reset Email Error: " + err)
      emailError('aniruddh.mishra@educationisttutoring.org', 'Activate Deployment', options)
  }
}

async function getNewToken(code) {
  try {
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
  } catch (error) {
    console.log('Token Collection Error: ' + error);
  }
}

function makeUser(name, eid, homeEmail) {
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
  return userRequest.post('https://admin.googleapis.com/admin/directory/v1/users', userData)
}

function deleteUser(email) {
  userRequest.delete('https://admin.googleapis.com/admin/directory/v1/users/' + email)
}

function updateUser(email, data) {
  const password = generatePassword()
  console.log(password)
  userRequest.put('https://admin.googleapis.com/admin/directory/v1/users/' + email, data)
}

module.exports.deleteUser = deleteUser
module.exports.changePassword = updateUser
module.exports.makeUser = makeUser
module.exports.getNewToken = getNewToken