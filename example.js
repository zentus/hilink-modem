const Modem = require('./lib')

const modem = new Modem()

const pingPong = async message => {
	console.log('recieved message:', message)

	const pingOrPong = (
		(message.text.toUpperCase() === 'PING' && 'PONG') ||
		(message.text.toUpperCase() === 'PONG' && 'PING')
	)

	const status = await modem.sendMessage({
		receiver: message.sender,
		text: pingOrPong || `Let's play ping pong!`
	})

	console.log('sent message:', status)
}

// Listen for new SMS messages
modem.onMessage(pingPong)

// Get Inbox
modem.getInbox()
	.then(inbox => console.log(inbox))

// Get Outbox
modem.getOutbox()
	.then(outbox => console.log(outbox))

// Send SMS message
modem.sendMessage({ receiver: '+46736000000', text: 'hello world' })
	.then(status => console.log(status))
