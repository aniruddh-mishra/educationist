const base = 'https://api-m.sandbox.paypal.com'
const fetch = require('node-fetch')

// create an order
async function createOrder(amount, CLIENT_ID, APP_SECRET) {
    const accessToken = await generateAccessToken(CLIENT_ID, APP_SECRET)
    const url = `${base}/v2/checkout/orders`
    const response = await fetch(url, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: 'USD',
                        value: amount,
                    },
                },
            ],
        }),
    })
    console.log(response)
    const data = await response.json()
    console.log(data)
    return data
}

// capture payment for an order
async function capturePayment(orderId, CLIENT_ID, APP_SECRET) {
    const accessToken = await generateAccessToken(CLIENT_ID, APP_SECRET)
    const url = `${base}/v2/checkout/orders/${orderId}/capture`
    const response = await fetch(url, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    })
    const data = await response.json()
    return data
}

// call this function to create your client token
async function generateClientToken(CLIENT_ID, APP_SECRET) {
    const accessToken = await generateAccessToken(CLIENT_ID, APP_SECRET)
    const response = await fetch(`${base}/v1/identity/generate-token`, {
        method: 'post',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Accept-Language': 'en_US',
            'Content-Type': 'application/json',
        },
    })
    const data = await response.json()
    return data.client_token
}

// access token is used to authenticate all REST API requests
async function generateAccessToken(CLIENT_ID, APP_SECRET) {
    const auth = Buffer.from(CLIENT_ID + ':' + APP_SECRET).toString('base64')
    const response = await fetch(`${base}/v1/oauth2/token`, {
        method: 'post',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${auth}`,
        },
    })
    const data = await response.json()
    return data.access_token
}

module.exports.createOrder = createOrder
module.exports.capturePayment = capturePayment
module.exports.generateAccessToken = generateAccessToken
module.exports.generateClientToken = generateClientToken
