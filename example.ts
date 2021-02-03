import Modem from "./lib";

const modem = new Modem({
    // modemIp: '192.168.8.1',
    // messageDelay: 1,
    // bigMessageDelay: 30,
    // sendMessageStatusDelay: 1,
    // waitForPendingRequest: true
});
  
  // Send SMS message
async function send() {
    const response = await modem.sendMessage({
        receiver: "+46123456789",
        text: "Hello world!"
    });

    console.log("response", response);
};
// send();

// Get received SMS messages
async function received() {
    const response = await modem.getMessages({
        type: 'received'
        // count: 20,
        // page: 1,
        // sort: 'descending'
      });
    console.log("response", response);
};
// received();


async function status() {
    console.log("Status");
    const response = await modem.apiRequest("/monitoring/status");

    console.log("response", response);
};
// status();


async function disconnect() {
    const result = await modem.disconnect();
    console.log("disconnect", result);
}
// disconnect();


async function connect() {
    const result = await modem.connect();
    console.log("connect", result);
}
// disconnect();


async function traffic() {
    const result = await modem.trafficStatistics();
    console.log("traffic statistics", result);
}
// traffic());