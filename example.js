const Modem = require('./lib')

const modem = new Modem({
	// modemIp: '192.168.8.1',
	// messageDelay: 1,
	// bigMessageDelay: 30,
	// sendMessageStatusDelay: 1,
	// waitForPendingRequest: true
})

// modem.apiRequest('/cradle/basic-info').then(console.log)
modem.getMailbox().then(console.log)

// // Send SMS message
// modem.sendMessage({
// 	// receiver: '+46736000000',
// 	// text: 'hello world'
// }).then(status => console.log(status))
//
// // Get SMS Inbox
// modem.getInbox({
// 	// page: 1,
// 	// count: 1,
// 	// sort: 'ascending'
// }).then(messages => console.log(messages))
//
// // Get SMS Outbox
// modem.getOutbox({
// 	// count: 20
// 	// page: 1
// 	// sort: 'descending'
// }).then(messages => console.log(messages))
//
// // Listen for new SMS messages
// modem.onMessage(async message => {
// 	console.log('recieved message:', message)
//
// 	const pingOrPong = (
// 		(message.text.toUpperCase() === 'PING' && 'PONG') ||
// 		(message.text.toUpperCase() === 'PONG' && 'PING')
// 	)
//
// 	const status = await modem.sendMessage({
// 		receiver: message.sender,
// 		text: pingOrPong || `Let's play ping pong!`
// 	})
//
// 	console.log('sent message:', status)
// })
