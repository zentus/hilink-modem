const Modem = require('./lib')

const modem = new Modem({
  // modemIp: '192.168.8.1',
  // messageDelay: 1,
  // bigMessageDelay: 30,
  // sendMessageStatusDelay: 1,
  // waitForPendingRequest: true
})

// Send SMS message
modem.sendMessage({
  // receiver: '+46123456789',
  // text: 'Hello world!'
}).then(status => console.log(status))

// Get SMS Inbox
modem.getInbox({
  // count: 20
  // page: 1
  // sort: 'descending'
}).then(messages => console.log(messages))

// Get SMS Outbox
modem.getOutbox({
  // count: 20
  // page: 1
  // sort: 'descending'
}).then(messages => console.log(messages))

// Listen for new SMS messages
modem.onMessage(async message => {
  console.log('recieved message:', message)

  const pingOrPong = (
    (message.text.trim().toLowerCase() === 'ping' && 'Pong') ||
    (message.text.trim().toLowerCase() === 'pong' && 'Ping')
  )

  const status = await modem.sendMessage({
    receiver: message.sender,
    text: pingOrPong || 'Let\'s play Ping Pong!'
  })

  console.log('sent message:', status)
})

// Make a custom Hilink API request with tokens provided
modem.apiRequest('/status', {
  // method: 'get',
  // body: undefined
}).then(console.log)
