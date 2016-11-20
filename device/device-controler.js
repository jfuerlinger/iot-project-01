var PubNub = require("pubnub");
var gpio = require("pi-gpio");
var exec = require('child_process').exec;
var moment = require('moment');
var cloudinary = require('cloudinary');
var fs = require('fs');
var ubidots = require('ubidots');


var channelName = "IoTChannel";
var gpioLedPin = 40;

var ubidotsClient = ubidots.createClient("a60c5aeb2133f52c518517ce2870f8e5807aca1c");

var pubnub = new PubNub({
    subscribeKey: "sub-c-59ea358c-ace2-11e6-b37b-02ee2ddab7fe",
    publishKey: "pub-c-aec2c9d2-5afc-4677-993a-27da78960aec",
    ssl: true,
    logVerbosity: false
});

cloudinary.config({
    cloud_name: 'dmhyq8qap',
    api_key: '359498475116885',
    api_secret: 'hlyvhQR2KYB-caXrVMTdl9GJIU4'
});



function sendCommand(command, isRequest, payload) {
    pubnub.publish({
            channel: channelName,
            message: {
                command: command,
                type: isRequest ? "Request" : "Response",
                payload: payload
            }
        },
        function (status, response) {
            //console.log(status, response);
        }
    );
}


pubnub.addListener({

    message: function (m) {
        // handle message
        var channelName = m.channel; // The channel for which the message belongs
        var channelGroup = m.subscription; // The channel group or wildcard subscription match (if exists)
        var pubTT = m.timetoken; // Publish timetoken
        var msg = m.message; // The Payload

        if (msg.type === "Request") {
            console.log("Received command: " + msg.command);
            console.log(m);

            switch (msg.command) {
                case "getCurrentUser":
                    var cmd = "echo $USER";

                    var currentUserProcess = exec(cmd, function (error, stdout, stderr) {
                        if (error) console.log(error);

                        console.log(stdout);

                        sendCommand("getCurrentUser", false, {
                            user: stdout
                        });
                        console.log("Check completed.");
                    });

                    break;

                case "uploadMeasurment":

                    var cmd = "./device/tools/sht21 S";

                    var sht21Process = exec(cmd, function (error, stdout, stderr) {
                        if (error) console.log("ERROR: " + error);

                        var content = stdout.replace("\n", "");
                        var arr = content.split("\t");
                        var temperature = arr[0];
                        var humidity = arr[1];

                        ubidotsClient.auth(function () {
                            // this.getDatasources(function (err, data) {
                            //     console.log(data.results);
                            // });

                            //var ds = this.getDatasource("fujo-pi-01");

                            // ds.getVariables(function (err, data) {
                            //     console.log(data.results);
                            // });

                            // ds.getDetails(function (err, details) {
                            //     console.log(details);
                            // });

                            var varTemperature = this.getVariable("5831836a7625421d93d5461b");
                            var varHumidity = this.getVariable("583183637625421d02b274be");

                            // varTemperature.getDetails(function (err, details) {
                            //     console.log(details);
                            // });

                            // varHumidity.getDetails(function (err, details) {
                            //     console.log(details);
                            // });

                            varTemperature.saveValue(temperature.substr(0, temperature.indexOf('.')));
                            // varTemperature.getValues(function (err, data) {
                            //     console.log(data.results);
                            // });

                            varHumidity.saveValue(humidity);
                            // varHumidity.getValues(function (err, data) {
                            //     console.log(data.results);
                            // });

                            sendCommand("uploadMeasurement", false, {
                                temperature: temperature,
                                humidity: humidity
                            });
                        });

                        console.log("Measurment completed.");
                    });

                    break;

                case "getMeasurement":
                    var cmd = "./device/tools/sht21 S";

                    var sht21Process = exec(cmd, function (error, stdout, stderr) {
                        if (error) console.log("ERROR: " + error);

                        var content = stdout.replace("\n", "");
                        var arr = content.split("\t");
                        var temperature = arr[0];
                        var humidity = arr[1];

                        sendCommand("getMeasurement", false, {
                            temperature: temperature,
                            humidity: humidity
                        });
                        console.log("Measurment completed.");
                    });

                    break;

                case "displayMessage":
                    console.log("Received message: " + msg.payload.message);
                    break;

                case "takePicture":
                    console.log("Taking a picture ...");
                    var fileName = "/home/pi/Pictures/img_" + moment().format("YYYYMMD_HHmmss") + ".jpg";
                    var cmd = "fswebcam " + fileName;
                    console.log(cmd);

                    exec(cmd, function (error, stdout, stderr) {
                        console.log("Picture taken.");
                    });

                    setTimeout(function () {
                        var streamCloudinary = cloudinary.uploader.upload_stream(function (result) {
                            console.log(result)
                            console.log("Upload done.");

                            fs.unlinkSync(fileName);
                            console.log("File deleted.")
                        });
                        var streamInput = fs.createReadStream(fileName).pipe(streamCloudinary);
                    }, 5000);

                    break;

                case "enableLed":
                    console.log("Enabling the LED ...");
                    gpio.write(gpioLedPin, 1);
                    console.log("Done.");

                    sendCommand("enableLed", false, {
                        success: true
                    });

                    break;

                case "disableLed":
                    console.log("Disabling the LED ...");
                    gpio.write(gpioLedPin, 0);
                    console.log("Done.");

                    sendCommand("disableLed", false, {
                        success: true
                    });

                    break;
            } //switch
        } //if

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

console.log(">> Initializing GPIO ...");
gpio.open(gpioLedPin, "output");
console.log(">> Done.");

process.on('SIGINT', function () {
    console.log('Got SIGINT. Press Control-D to exit.');
    gpio.close(gpioLedPin);
});