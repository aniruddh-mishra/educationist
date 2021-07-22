const axios = require('axios');
const fs = require('fs');
const {google} = require('googleapis');
const { sendMail } = require(__dirname + '/emailer.js');
require('dotenv').config({
  path: __dirname + '/.env'
});

const SCOPES = ['https://www.googleapis.com/auth/admin.directory.user'];

const {client_secret, client_id, redirect_uris} = JSON.parse(process.env.GOOGLE_CERT).web;

var oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

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

function authorize() {
  try {
    if (oauth2Client) {
      console.log(oauth2Client.credentials)
      if (oauth2Client.credentials) {
        return true
      }
      let tokens = fs.readFileSync(__dirname + '/token.json');
      oauth2Client.credentials = JSON.parse(tokens)
      return true
    } else {
      const {client_secret, client_id, redirect_uris} = JSON.parse(process.env.GOOGLE_CERT).web;

      oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      let tokens = fs.readFileSync(__dirname + '/token.json');
      oauth2Client.credentials = JSON.parse(tokens)
      return true
    }
  } catch {
    newURL()
  }
}

async function newURL() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  const options = [{
    key: 'link1',
    text: authUrl
  }]
  return sendMail('aniruddh.mishra@educationisttutoring.org', 'Activate Deployment', __dirname + '/root/emails/activate.html', options)
}

async function getNewToken(code) {
  try {
    const {tokens} = await oauth2Client.getToken(code);
    storeToken(tokens)
  } catch (error) {
    console.log('Token Collection Error: ' + error);
  }
}

function storeToken(tokens) {
  const TOKEN_PATH = __dirname + '/token.json'
  fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), (err) => {
    if (err) return console.warn(`Token not stored to ${TOKEN_PATH}`, err);
    authorize()
    console.log(`Token stored to ${TOKEN_PATH}`);
  });
}

function makeUser(name, eid, homeEmail) {
  const headers = {
    'Authorization': 'Bearer ' + oauth2Client.credentials.access_token,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
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
  axios({
    method: 'post',
    url: 'https://admin.googleapis.com/admin/directory/v1/users/',
    data: userData,
    headers: headers
  })
}

function deleteUser(email) {
  const headers = {
    'Authorization': 'Bearer ' + oauth2Client.credentials.access_token,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  axios({
    method: 'delete',
    url: 'https://admin.googleapis.com/admin/directory/v1/users/' + email,
    headers: headers
  })
}

function updateUser(email, data) {
  const headers = {
    'Authorization': 'Bearer ' + oauth2Client.credentials.access_token,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  const password = generatePassword()
  console.log(password)
  axios({
    method: 'put',
    url: 'https://admin.googleapis.com/admin/directory/v1/users/' + email,
    data: data,
    headers: headers
  })
}

module.exports.deleteUser = deleteUser
module.exports.changePassword = updateUser
module.exports.makeUser = makeUser
module.exports.getNewToken = getNewToken
module.exports.authorize = authorize