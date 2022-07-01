const fetch = require('node-fetch')
const { processURL } = require(__dirname + '/setup.js')
const client_id = '1000.WAYQ6BA95JP8D41E8TBVT7YFTQ1W3N'
const secret = process.env.ZOHO_SECRET
const redirect_uri = processURL + '/zohoredirect'

async function code() {
    const paramsObject = {
        client_id: client_id,
        response_type: 'code',
        redirect_uri: redirect_uri,
        scope: 'ZohoCampaigns.campaign.CREATE,ZohoCampaigns.campaign.UPDATE,ZohoCampaigns.contact.UPDATE',
        prompt: 'consent',
    }
    const target = new URL('https://accounts.zoho.com/oauth/v2/auth')
    target.search = new URLSearchParams(paramsObject).toString()
    const response = await fetch(target, {
        method: 'GET',
    })
    return response.url
}

async function token(code) {
    const paramsObject = {
        client_id: client_id,
        grant_type: 'authorization_code',
        client_secret: secret,
        redirect_uri: redirect_uri,
        code: code,
    }
    const target = new URL('https://accounts.zoho.com/oauth/v2/token')
    target.search = new URLSearchParams(paramsObject).toString()
    const response = await fetch(target, {
        method: 'POST',
        headers: {
            Origin: processURL,
        },
    })
    return await response.text()
}

async function campaign(name, subject, content, list, token) {
    const paramsObject = {
        campaignname: 'Test',
        from_email: 'educationist@educationisttutoring.org',
        subject: 'Welcome Aboard',
        content_url:
            'https://dashboard.educationisttutoring.org/newsletter/february-2022',
        list_details: JSON.stringify({
            listkey:
                '3z668dcbee2225c29f1acb1684f08cb6b1dfae786c95c75ba66e87d54fb8f4d0e7',
        }),
    }
    const target = new URL('https://campaigns.zoho.com/api/v1.1/createCampaign')
    target.search = new URLSearchParams(paramsObject).toString()
    console.log({
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Zoho-oauthtoken ' + token,
        Origin: processURL,
    })
    const response = await fetch(target, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Zoho-oauthtoken ' + token,
            Origin: processURL,
        },
    })
    const responseText = await response.text()
    console.log(responseText)
    return responseText
}

module.exports.code = code
module.exports.token = token
module.exports.campaign = campaign
