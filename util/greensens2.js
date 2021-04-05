var request = require('sync-request');
var BaseURL = 'https://api.greensens.de';

class greensens {

    constructor(Email, password) {

        this.Email = Email;
        this.password = password;
    }

    log(msg) {
        console.log(msg);
    }

    GetToken(token) {
        var body = JSON.stringify({ password: this.password, login: this.Email });
        var options = {
            body: body,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': body.length
            }
        };
        var res;
        try {
            res = request('POST', 'https://api.greensens.de/api/users/authenticate', options);
        } catch (e) { console.error(e) }
        if (res.statusCode === 200) {
            var P = JSON.parse(res.body);
            //console.log("res:"+P.data.token);
            return P.data.token;
        }
    }

    SendRequest(token, path) {
        var options = {
            headers: { Authorization: 'Bearer ' + token, accept: 'application/json' },// Content-Type: 'application/json'},
            form: null
        }
        var res;
        try {
            res = request('GET', BaseURL + path, options);
        } catch (e) { console.error(e) }
        if (res) {
            var P = JSON.parse(res.body);
            return P.data;
        }
    }

    GetPlants(xtoken) {
        var path = '/api/plants';
        var json = this.SendRequest(xtoken, path);
        return json;
    }

}
module.exports = greensens;
