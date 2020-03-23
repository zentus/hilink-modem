const Modem = require('./lib')

const modem = new Modem()

modem.onMessage(async message => {
	console.log('got message', message)

	// await modem.sendMessage({
	// 	receiver: '0' + String(message.Phone).slice(2),
	// 	text: message.Content
	// }).then(console.log)
})
