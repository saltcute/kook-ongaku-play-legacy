import crypto from 'crypto';
import axios from 'axios';
import delay from 'delay';
import * as fs from 'fs';

const spotikookURI = "https://connect.lolicon.ac.cn/spotikook";

var accessToken = "";
var expiresIn = -1;
var clientUUID = "";

function haveAuth(auth: any): auth is { accessToken: string, expiresIn: number, clientUUID: string } {
    return auth.accessToken && auth.expiresIn && auth.clientUUID;
}


var auth: any;

try {
    auth = JSON.parse(fs.readFileSync('src/configs/data.json', { encoding: "utf-8", flag: 'r' }));
} catch (e) {
    auth = {};
}


export async function loginSpotify() {
    if (haveAuth(auth)) {
        accessToken = auth.accessToken;
        expiresIn = auth.expiresIn;
        clientUUID = auth.clientUUID;
        if (expiresIn - Date.now() <= 15 * 60 * 1000) return refreshSpotify();
        else return;
    }
    if (!clientUUID)
        clientUUID = crypto.randomUUID();
    console.log(`Open ${spotikookURI + "/login?state=" + clientUUID}`);
    var gotToken = false;
    while (!gotToken) {
        await delay(500);
        await axios.get(spotikookURI + "/token?state=" + clientUUID).then((res) => {
            accessToken = res.data.access_token;
            expiresIn = parseInt(res.data.expires_in);
            console.log('Login sucess, token:');
            console.log(accessToken);
            console.log('Expires in:')
            console.log(expiresIn);
            gotToken = true;
        }).catch(() => { console.log("Getting token not successful, waiting...") });
        await delay(500);
    }
    fs.writeFileSync('src/configs/data.json', JSON.stringify({
        accessToken: accessToken,
        expiresIn: expiresIn,
        clientUUID: clientUUID
    }), { encoding: 'utf-8', flag: 'w' });
}

export async function refreshSpotify() {
    await axios(spotikookURI + "/refresh?state=" + clientUUID).then((res) => {
        expiresIn = parseInt(res.data.expires_in);
        accessToken = res.data.access_token;
        console.log('Refreshed token, new token:');
        console.log(accessToken);
        console.log('Expires in:')
        console.log(expiresIn);
    }).catch(() => { console.log("Refreshing token not successful"); return "" });
    fs.writeFileSync('src/configs/data.json', JSON.stringify({
        accessToken: accessToken,
        expiresIn: expiresIn,
        clientUUID: clientUUID
    }), { encoding: 'utf-8', flag: 'w' });
}

export async function getToken() {
    if (expiresIn) {
        if (expiresIn - Date.now() <= 15 * 60 * 1000)
            await refreshSpotify();
    } else {
        await loginSpotify();
    }
    return accessToken;
}