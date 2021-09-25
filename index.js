/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import express from "express"
import msal from '@azure/msal-node'
import axios from 'axios'

const SERVER_PORT = process.env.PORT || 3000;
const REDIRECT_URI = "http://localhost:3000/redirect";

// Before running the sample, you will need to replace the values in the config, 
// including the clientSecret
const config = {
    auth: {
        clientId: "e90d57b2-8a31-4626-ad76-5d239204b400",
        authority: "https://login.microsoftonline.com/64dde762-4069-47e9-80d6-4bd9a46b46d1",
        clientSecret: "Fmu7Q~2Rb8LiyAP9OhfjFDagUIZKvn2NoIJlM"
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    },
    cache: {
        cacheLocation: 'sessionStorage'
    }
};

// Create msal application object
const pca = new msal.ConfidentialClientApplication(config);

// Create Express App and Routes
const app = express();

app.get('/', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
    };

    // get url to sign user in and consent to scopes needed for application
    pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});

// const authenticateToken = async (req, res, next) => {
//     const tokenRequest = {
//         code: req.query.code,
//         scopes: ["user.read"],
//         redirectUri: REDIRECT_URI,
//     };
//     console.log(req.query.code)
//     pca.acquireTokenSilent()

//     pca.acquireTokenByCode(tokenRequest).then((response) => {
//         res.setHeader(`Authentication=${req.query.code}`)
//         next()
//     }).catch((error) => {
//         console.log(error);
//         if (error.errorCode == 'invalid_grant') {
//             res.redirect('https://localhost:3000/')
//         }
//     });
// }
app.get('/test', (req, res) => {
    res.json("THE USER IS ALREADY LOGGED")
});


app.get('/logout', (req, res) => {
    const logoutURI = 'https://login.microsoftonline.com/64dde762-4069-47e9-80d6-4bd9a46b46d1/oauth2/v2.0/logout'
    const redirectURI = 'http://localhost:3000/'
    res.redirect(`${logoutURI}?post_logout_redirect_uri=${redirectURI}`);
});


async function getImage(accessToken) {
    const res = await axios.get('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': "image/jpeg"
        }
    });

    return res.data
}

import fetch from 'node-fetch';
import fileType from 'file-type';
async function getImage2(accessToken) {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': "image/jpeg"
        }
    });
    const buffer = await res.buffer();
    const type = await fileType.fromBuffer(buffer)
    
    return buffer.toString("base64")
}



app.get('/redirect', async (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
    };

    await pca.acquireTokenByCode(tokenRequest)
        .then(async (response) => {
            // console.log("\nResponse:\n", response.accessToken);
            const accessToken = response.accessToken;
            console.log(accessToken)
            const image = await getImage2(accessToken)
            let html = `<img src="data:image/jpeg;base64,${image}"/>`
            res.send(html)
        }).catch((error) => {
            console.log(error);
            res.status(500).send(error);
        });
});




app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`))
