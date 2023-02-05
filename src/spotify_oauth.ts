import express from "express";
import * as querystring from "querystring"
import axios from "axios";
import auth from "configs/auth";

var client_id = auth.client_id;
var client_secret = auth.client_secret;
var redirect_uri = 'http://localhost:8888/callback';
var tokens: { [key: string]: any } = {};
var app = express();

app.get('/login', (req, res) => {
    // var state = crypto.randomBytes(16).toString("base64");
    var state: any;
    if (!req.query.state) {
        res.status(400);
        res.send({
            status: "error",
            message: "State required"
        });
        return;
    } else {
        state = req.query.state;
    }
    var scope = 'user-read-currently-playing user-read-playback-state streaming';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get('/token', (req, res) => {
    res.header({
        "Access-Control-Allow-Origin": "*"
    })
    var state = req.query.state || null;
    if (state && tokens.hasOwnProperty(<string>state)) {
        res.send({
            access_token: tokens[(<string>state)].access_token,
            expires_in: tokens[(<string>state)].expires_in
        });
    } else {
        res.status(400);
        res.send({
            status: "error",
            message: "State invalid"
        });
    }
})

app.get('/callback', (req, res) => {

    var code = req.query.code || null;
    var state = req.query.state || null;

    if (state === null) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        axios({
            method: "POST",
            url: 'https://accounts.spotify.com/api/token',
            data: querystring.stringify({
                code: (<string>code),
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
            }
        }).then((res) => {
            var data = res.data;
            data.expires_in = Date.now() + data.expires_in * 1000;
            tokens[(<string>state)] = data;
        }).catch((e) => {
            console.error(e);
        })
        res.send({
            status: "success"
        });
    }
})

app.get('/refresh', function (req, res) {
    var state = req.query.state

    if (state === null) {
        res.status(400);
        res.send({
            status: "error",
            message: "State invalid"
        });
    } else {
        if (state && tokens.hasOwnProperty(<string>state)) {
            var refresh_token = tokens[<string>state].refresh_token
            axios({
                method: "POST",
                url: 'https://accounts.spotify.com/api/token',
                data: querystring.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: refresh_token
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
                }
            }).then((re) => {
                var data = re.data;
                data.expires_in = Date.now() + data.expires_in * 1000;
                tokens[(<string>state)] = data;
                res.send({
                    access_token: tokens[(<string>state)].access_token,
                    expires_in: tokens[(<string>state)].expires_in
                });
            }).catch((e) => {
                console.error(e);
                res.status(500);
                res.send({
                    status: "error",
                    message: e
                });
            })
        } else {
            res.status(400);
            res.send({
                status: "error",
                message: "State invalid"
            });
        }
    }
});

const port = 8888;

app.listen(port);
console.log("Server started listening on port " + port);