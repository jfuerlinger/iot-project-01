PubNub = require("pubnub"); 
var gpio = require("pi-gpio");

var channelName = "IoTChannel";
var gpioLedPin = 25;

var pubnub = new PubNub({
    subscribeKey: "sub-c-59ea358c-ace2-11e6-b37b-02ee2ddab7fe",
    publishKey: "pub-c-aec2c9d2-5afc-4677-993a-27da78960aec",
    ssl: true
});




pubnub.addListener({

    message: function (m) {
        // handle message
        var channelName = m.channel; // The channel for which the message belongs
        var channelGroup = m.subscription; // The channel group or wildcard subscription match (if exists)
        var pubTT = m.timetoken; // Publish timetoken
        var msg = m.message; // The Payload

        console.log("Received command: " + msg.command);
        switch (msg.command) {
            case "displayMessage":
                console.log("Received message: " + msg.message);
                break;
            case "takePicture":
                console.log("Taking a picture ...");
                break;
            case "enableLed":
                console.log("Enabling the LED ...");
                gpio.open(gpioLedPin, "output", function (err) { // Open pin 16 for output
                    gpio.write(gpioLedPin, 1, function () { // Set pin 16 high (1)
                        gpio.close(gpioLedPin); // Close pin 16
                    });
                });
                console.log("Done.");
                break;
            case "disableLed":
                console.log("Disabling the LED ...");
                gpio.open(gpioLedPin, "output", function (err) { // Open pin 16 for output
                    gpio.write(gpioLedPin, 0, function () { // Set pin 16 high (1)
                        gpio.close(gpioLedPin); // Close pin 16
                    });
                });
                console.log("Done.");
                break;
        }

    },
    presence: function (p) {
        // handle presence
        var action = p.action; // Can be join, leave, state-change or timeout
        var channelName = p.channel; // The channel for which the message belongs
        var occupancy = p.occupancy; // No. of users connected with the channel
        var state = p.state; // User State
        var channelGroup = p.subscription; //  The channel group or wildcard subscription match (if exists)
        var publishTime = p.timestamp; // Publish timetoken
        var timetoken = p.timetoken; // Current timetoken
        var uuid = p.uuid; // UUIDs of users who are connected with the channel
    },
    status: function (s) {
        // handle status
    }
});

console.log(">> Subscribing ...");
pubnub.subscribe({
    channels: [channelName],
    withPresence: true // also subscribe to presence instances.
});
console.log(">> Done.");