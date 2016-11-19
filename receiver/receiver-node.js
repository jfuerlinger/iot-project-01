PubNub = require("pubnub"); //ES5
//import PubNub from 'pubnub';        //ES6

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
            case "sendMessage":
                console.log("Received message: " + msg.message);
                break;
            case "takePicture":
                console.log("Taking a picture ...");
                break;
            case "enableLed":
                console.log("Enabling the LED ...");
                break;
            case "disableLed":
                console.log("Disabling the LED ...");
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

pubnub.subscribe({
    channels: ["hello_world"],
    withPresence: true // also subscribe to presence instances.
});