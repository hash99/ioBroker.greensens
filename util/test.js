var greensens = require("./greensens.js");
var greensens2 = require("./greensens2.js");

var pwd = "";
var email = "";

/* var greensens_instance;
greensens_instance = new greensens(email, pwd);

var json = 
greensens_instance.GetToken(function (err, token) {
        if (!err) {
                greensens_instance.GetPlants(token, function (json) {
                        //console.log("Results: " + json);
                        return json;
                });
 
        };
});
console.log("Results: " + json);                
*/

var greensens2_inst = new greensens2(email, pwd);
var token;
var Hubs;
token = greensens2_inst.GetToken();
//console.log(token);
Hubs = greensens2_inst.GetPlants(token);
//console.log(JSON.stringify(Hubs));
//var Hub = JSON.parse(json);
if (Hubs) {
        console.log(Hubs.registeredHubs[0].name);
        var plants = Hubs.registeredHubs[0].plants;
        var i = 0;
        do {
                console.log(plants[i].temperature);
                i = i + 1;
        } while (i < plants.length);
}
