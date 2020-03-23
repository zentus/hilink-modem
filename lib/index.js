const got = require('got')
const JSDOM = require('jsdom').JSDOM
const { toJSON, toXML, createTimeString, wait } = require('./utils')

class Modem {
	constructor(options = {}) {
		this.defaultOptions = {
			modemIp: '192.168.8.1',
			messageDelay: 1,
			bigMessageDelay: 20,
			sendMessageStatusDelay: 1
		}
		this.modemIp = options.modemIp || this.defaultOptions.modemIp
		this.messageDelay = options.messageDelay || this.defaultOptions.messageDelay
		this.bigMessageDelay = options.bigMessageDelay || this.defaultOptions.bigMessageDelay
		this.sendMessageStatusDelay = options.sendMessageStatusDelay || this.defaultOptions.sendMessageStatusDelay

		this.isPending = false

		this.token = null
		this.lastMessageIndex = null
		this.lastRecievedBigMessageIndex = null
		this.waitingForBigMessage = false
	}

	async waitForPending() {
		return new Promise(resolve => {
			const interval = setInterval(() => {
				if (!this.isPending) {
					clearInterval(interval)
					resolve()
				}
			}, 100)
		})
	}

	setPending(boolean) {
		this.isPending = Boolean(boolean)
	}

	async setToken (token) {
		this.token = {
			...this.token,
			...token
		}
	}

	async getToken () {
		await this.waitForPending()

		this.setPending(true)
		const response = await got(`http://${this.modemIp}/html/index.html`)

		const dom = new JSDOM(response.body)
		const session = response.headers['set-cookie'][0].match(/SessionID=(.*);path/)[1]
		const verification = dom.window.document.querySelector('meta[name="csrf_token"]').content

		const token = {
			session,
			verification
		}

		this.setToken(token)
		this.setPending(false)

		return token
	}

	getHeaders (token) {
		const headers = {
			'__RequestVerificationToken': token.verification,
			'Cookie': `SessionID=${token.session}`,
			'Content-Type': 'application/x-www-form-urlencoded',
			'X-Requested-With': 'XMLHttpRequest'
		}

		return headers
	}

	async getMailbox (options = {}) {
		await this.waitForPending()
		const token = this.token || await this.getToken()
		const count = options.count || 20
		const page = options.page || 1
		const boxType = options.boxType || 1
		const sortType = options.sortType || 0
		const ascending = options.ascending === true ? 1 : 0
		const unreadPreferred = options.unreadPreferred === true ? 1 : 0
		const headers = this.getHeaders(token)

		const body = toXML({
			request: {
				PageIndex: page,
				ReadCount: count,
				BoxType: boxType,
				SortType: sortType,
				Ascending: ascending,
				UnreadPreferred: unreadPreferred
			}
		})

		this.setPending(true)

		const response = await got.post(`http://${this.modemIp}/api/sms/sms-list`, {
			headers,
			body
		})

		this.setToken({
			verification: response.headers.__requestverificationtoken
		})

		this.setPending(false)

		return toJSON(response.body).response
	}

	async getInbox (options) {
		return this.getMailbox({
			...options,
			boxType: 1
		})
	}

	async getOutbox (options) {
		return this.getMailbox({
			...options,
			boxType: 2
		})
	}

	async getSmsStatus (receiver, token) {
		await this.waitForPending()
		token = token || this.token
		const headers = this.getHeaders(token)
		const parsedReceiver = parseInt(receiver, 10)

		this.setPending(true)

		const sendStatusResponse = await got.get(`http://${this.modemIp}/api/sms/send-status`, {
			headers
		})

		this.setPending(false)

		const response = sendStatusResponse && toJSON(sendStatusResponse.body).response

		if (!response || response.FailPhone === parsedReceiver) {
			return {
				success: false,
				message: `Failed to send SMS ${response.CurIndex} of ${response.TotalCount}`,
				receiver
			}
		}

		if (response.SucPhone === parsedReceiver && response.CurIndex === response.TotalCount) {
			return {
				success: true,
				totalSent: response.TotalCount,
				receiver
			}
		}

		await wait(this.sendMessageStatusDelay)

		return this.getSmsStatus(receiver, token)
	}

	async sendMessage (options = {}) {
		await this.waitForPending()
		const receiver = options.receiver
		const text = options.text

		if (typeof receiver !== 'string' || typeof text !== 'string') {
			throw new Error('sendMessage(options) expected options.receiver and options.text to be strings')
		}

		const token = this.token || await this.getToken()
		const headers = this.getHeaders(token)

		const body = toXML({
			request: {
				Index: "-1",
				Phones: {
					Phone: String(receiver)
				},
				Content: String(text),
				Length: String(text).length,
				Reserved: '1',
				Date: createTimeString()
			}
		})

		this.setPending(true)

		const sendSmsResponse = await got.post(`http://${this.modemIp}/api/sms/send-sms`, {
			headers,
			body
		})

		this.setToken({
			verification: sendSmsResponse.headers.__requestverificationtoken
		})

		this.setPending(false)

		const sendSmsResponseBody = toJSON(sendSmsResponse.body).response

		if (sendSmsResponseBody === 'OK') {
			const status = await this.getSmsStatus(receiver, token)

			return status
		}

		return {
			success: false,
			receiver
		}
	}

	async onMessage (callback) {
		const initialResponse = (await this.getInbox({ count: 1 }))
		const initialMessage = initialResponse && initialResponse.Count > 0 && initialResponse.Messages !== '' && initialResponse.Messages.Message

		if (!initialMessage) {
			await wait(this.messageDelay)
			return this.onMessage(callback)
		}

		this.lastMessageIndex = initialMessage.Index
		this.lastRecievedBigMessageIndex = initialMessage.SmsType === 2 && initialMessage.Index
		this.waitingForBigMessage = false

		await this.getLastMessage(callback)
	}

	async getLastMessage (callback) {
		const [inbox] = await Promise.all([
			this.getInbox({ count: 1 }),
			wait(this.messageDelay)
		])

		const message = inbox.Messages.Message

		if (message.Phone === 'MMS') return this.getLastMessage(callback)

		if (message.SmsType === 2 && message.Index !== this.lastRecievedBigMessageIndex) {
			if (this.waitingForBigMessage) {
				this.waitingForBigMessage = false
				console.log('will stop waiting for big message and call callback if message.Index !== this.lastMessageIndex')
			} else {
				this.waitingForBigMessage = true
				console.log('will wait for', this.bigMessageDelay, 'seconds')
				return wait(this.bigMessageDelay).then(() => this.getLastMessage(callback))
			}
		}

		if (message.Index !== this.lastMessageIndex) {
			console.log('message.Index !== this.lastMessageIndex', message.Index !== this.lastMessageIndex)
			console.log('message.Index',message.Index)
			console.log('this.lastMessageIndex',this.lastMessageIndex)
			console.log('setting this.lastMessageIndex to message.Index:',message.Index)
			this.lastMessageIndex = message.Index
			if (message.SmsType === 2) {
				console.log('setting this.lastRecievedBigMessageIndex to message.Index:', message.Index)
				this.lastRecievedBigMessageIndex = message.Index
			}

			// this.lastEmittedMessageIndex = message.Index
			await callback(message)
		}

		return this.getLastMessage(callback)
	}
}

module.exports = Modem
