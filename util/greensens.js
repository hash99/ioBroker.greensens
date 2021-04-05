var request = require("request");
//var request = require('sync-request');
var bodyParser = require('body-parser');
var BaseURL = 'https://api.greensens.de';

class greensens {


        constructor(Email, password) {

                this.Email = Email;
                this.password = password;
        }
        log(msg) {
                console.log(msg);
        }

        async GetToken(callback) {
                var body = JSON.stringify({ password: this.password, login: this.Email });
                //console.log(body);
                //console.log(body);
                var options = {
                        url: 'https://api.greensens.de/api/users/authenticate',
                        method: 'POST',
                        body: body,
                        headers: {
                                'Content-Type': 'application/json',
                                'Content-Length': body.length
                        }
                };
                const req = request(options, function (error, response, body) {
                        if (response.statusCode === 200) {
                                var P = JSON.parse(body);
                                //console.log(P.data.token);
                                return callback(P.errors, P.data.token);
                        }
                        else {
                                console.warn(response.statusCode + ' Login Error !');
                                console.warn(response.status);
                                console.warn("Reque " + request.options);
                                return callback(true, null);
                        }
                }
                )
                req.close
        }

        SendRequest(token, path, callback) {
                var options = {
                        url: BaseURL + path,
                        method: 'GET',
                        headers: { Authorization: 'Bearer ' + token, accept: 'application/json' },// Content-Type: 'application/json'},
                        form: null
                }
                //console.log(options);
                const req = request(options, function (error, response, body) {
                        //console.log(response.statusCode);
                        if (!error) {

                                switch (response.statusCode) {
                                        case 200: // OK
                                                //console.log(body);
                                                callback(body);
                                        default:
                                                callback(null);
                                }
                        }
                });
                
                req.close;

                //callback( '"test": "x"');
        }

        GetPlants(xtoken, callback) {
                var path = '/api/plants';
//                console.log("xtoken:" + xtoken);
                //var xjson;
                this.SendRequest(xtoken, path, function (json) {
                       
                        //console.log("ijson" + json);
                        callback(json);
                });
                //console.log("xxxjson" + xjson);
                //var json = xtoken;
                
        }
        FillPlants(token) {
                this.GetPlants(token, function(json){return json});
        }

}
module.exports = greensens;
