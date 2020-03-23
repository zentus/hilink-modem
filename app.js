const Modem = require('./lib')

const modem = new Modem()

const pingPong = () => modem.onMessage(async message => {
	console.log('recieved message:', message)

	await modem.sendMessage({
		receiver: message.sender,
		text: message.text === 'ping' ? 'pong' : 'no ping pong?'
	}).then(status => console.log('sent message:', status))
})

pingPong()
