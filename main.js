"use strict";

/*
 * Created with @iobroker/create-adapter v1.32.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const adapterIntervals = {}; //halten von allen Intervallen
let request_count = 100; //max api request per Day

// Load your modules here, e.g.:
// const fs = require("fs");
const greensens2 = require("./util/greensens2.js");

class Greensens extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "greensens",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		var greensens2_inst = new greensens2(this.config.Greensens_account, this.config.Greensens_pwd);

		var token = greensens2_inst.GetToken();
		var Hubs = greensens2_inst.GetPlants(token);


		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.debug("token: " + token);
		this.log.info("Hubs: " + JSON.stringify(Hubs));
		//await this.readStatus(Hubs);

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		await this.setObjectNotExistsAsync("connect", {
			type: "state",
			common: {
				name: "connect",
				type: "boolean",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		this.subscribeStates("connect");
		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates("lights.*");
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates("*");

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		//await this.setStateAsync("testVariable", true);
		if (Hubs) { await this.setStateAsync("connect", true) } else { await this.setStateAsync("connect", false) };

		await this.setStatusObjects(Hubs);
		await this.readStatus(Hubs);


		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		//await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		//await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		//let result = await this.checkPasswordAsync("admin", "iobroker");
		//this.log.info("check user admin pw iobroker: " + result);

		//result = await this.checkGroupAsync("admin", "admin");
		//this.log.info("check group user admin group admin: " + result);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);
			clearTimeout(adapterIntervals.readAllStates);
			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }
	async readStatus(newStatus) {
		if (!newStatus) {
			var greensens2_inst = new greensens2(this.config.Greensens_account, this.config.Greensens_pwd);
			var token = greensens2_inst.GetToken();
			newStatus = greensens2_inst.GetPlants(token);
		}
		await this.setNewStatus(newStatus);
		adapterIntervals.readAllStates = setTimeout(this.readStatus.bind(this), ((24 * 60) / request_count) * 60000);
	}

	async setNewStatus(newStatus) {
		var hubs = newStatus.registeredHubs;
		this.log.debug("hubs: " + newStatus.registeredHubs.length + JSON.stringify(hubs));
		this.log.debug("hubsstring: " + JSON.stringify(newStatus));

		var i = 0;
		this.log.debug("hub: " + hubs[i].name + hubs.length);
		//createHubObject(hubs[i].name);
		do {
			var plants = hubs[i].plants;
			var j = 0;
			do {
				this.log.debug(plants[j].temperature);
				//createPlantsObject(hubs[i].name, j, plants[j]);
				var p = j + 1;
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'PlantId', { val: plants[j].plantId, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'SensorId', { val: plants[j].sensorID, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'PlantName', { val: plants[j].plantNameLA, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'temperature', { val: plants[j].temperature, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'moisture', { val: plants[j].moisture, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'illumination', { val: plants[j].illumination, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'minTemperature', { val: plants[j].minTemperature, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'minMoisture', { val: plants[j].minMoisture, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'minIllumination', { val: plants[j].minIllumination, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'maxTemperature', { val: plants[j].maxTemperature, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'maxMoisture', { val: plants[j].maxMoisture, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'maxIllumination', { val: plants[j].maxIllumination, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'temperaturePercent', { val: parseFloat(plants[j].temperaturePercent).toFixed(2), ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'moisturePercent', { val: parseFloat(plants[j].moisturePercent).toFixed(2), ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'illuminationPercent', { val: parseFloat(plants[j].illuminationPercent).toFixed(2), ack: true });
				var lastDate = new Date(plants[j].lastConnection * 1000);
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'LastConnection', { val: lastDate.toGMTString(), ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'link', { val: plants[j].link, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'state', { val: plants[j].state, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'stateColor', { val: plants[j].stateColor, ack: true });
				await this.setStateAsync(hubs[i].name + '.' + p + "." + 'calibration', { val: plants[j].calibration, ack: true });

				j = j + 1;
			} while (j < plants.length);
			i = i + 1;
		} while (i < hubs.length)

	}
	async setStatusObjects(newStatus) {
		var hubs = newStatus.registeredHubs;
		this.log.debug("hubs: " + newStatus.registeredHubs.length + JSON.stringify(hubs));
		this.log.debug("hubsstring: " + JSON.stringify(newStatus));

		var i = 0;
		this.log.debug("hub: " + hubs[i].name + hubs.length);
		this.createHubObject(hubs[i].name);
		do {
			var plants = hubs[i].plants;
			var j = 0;
			do {
				this.log.debug(plants[j].temperature);
				this.createPlantsObject(hubs[i].name, j + 1, plants[j]);
				j = j + 1;
			} while (j < plants.length);
			i = i + 1;
		} while (i < hubs.length)

	}


	createHubObject(hubname) {
		this.setObjectNotExistsAsync(hubname, {
			type: 'channel',
			common: {
				name: hubname,
				type: 'string',
				role: 'value'
			},
			native: {}
		});
	}
	createPlantsObject(hubname, j, plant) {
		this.setObjectNotExistsAsync(hubname + '.' + j, {
			type: 'channel',
			common: {
				name: "Plant",
				type: 'object',
				role: 'value'
			},
			native: {}
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".PlantName", {
			type: 'state',
			common: {
				name: 'PlantName',
				type: 'string',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".PlantId", {
			type: 'state',
			common: {
				name: 'PlantID',
				type: 'string',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".SensorId", {
			type: 'state',
			common: {
				name: 'SensorId',
				type: 'string',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".temperature", {
			type: 'state',
			common: {
				name: 'Temperature',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".moisture", {
			type: 'state',
			common: {
				name: 'Moisture',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".illumination", {
			type: 'state',
			common: {
				name: 'Illumination',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".minTemperature", {
			type: 'state',
			common: {
				name: 'Temperature',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".minMoisture", {
			type: 'state',
			common: {
				name: 'Moisture',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".minIllumination", {
			type: 'state',
			common: {
				name: 'Illumination',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".maxTemperature", {
			type: 'state',
			common: {
				name: 'Temperature',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".maxMoisture", {
			type: 'state',
			common: {
				name: 'Moisture',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".maxIllumination", {
			type: 'state',
			common: {
				name: 'Illumination',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".temperaturePercent", {
			type: 'state',
			common: {
				name: 'Temperature',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,                      // optional,  default 0
				min: 0,                      // optional,  default 0
				max: 100,                    // optional,  default 100
				unit: "%",                    // optional,  default %
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".moisturePercent", {
			type: 'state',
			common: {
				name: 'Moisture',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,                      // optional,  default 0
				min: 0,                      // optional,  default 0
				max: 100,                    // optional,  default 100
				unit: "%",                    // optional,  default %
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".illuminationPercent", {
			type: 'state',
			common: {
				name: 'Illumination',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,                      // optional,  default 0
				min: 0,                      // optional,  default 0
				max: 100,                    // optional,  default 100
				unit: "%",                    // optional,  default %
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".LastConnection", {
			type: 'state',
			common: {
				name: 'Last Connection',
				type: 'string',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".link", {
			type: 'state',
			common: {
				name: 'Link',
				type: 'string',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".state", {
			type: 'state',
			common: {
				name: 'State',
				type: 'string',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".stateColor", {
			type: 'state',
			common: {
				name: 'State Color',
				type: 'string',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.setObjectNotExistsAsync(hubname + '.' + j + ".calibration", {
			type: 'state',
			common: {
				name: 'Calibration',
				type: 'string',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Greensens(options);
} else {
	// otherwise start the instance directly
	new Greensens();
}