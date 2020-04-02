const promiseSequence = require('p-series')
const got = require('got')
const JSDOM = require('jsdom').JSDOM
const { toJSON, toXML, createTimeString, wait } = require('./utils')

class Modem {
  constructor (options = {}) {
    this.defaultOptions = {
      modemIp: '192.168.8.1',
      messageDelay: 1,
      bigMessageDelay: 30,
      sendMessageStatusDelay: 1,
      waitForPendingRequest: true
    }

    this.modemIp = options.modemIp || this.defaultOptions.modemIp
    this.messageDelay = options.messageDelay || this.defaultOptions.messageDelay
    this.bigMessageDelay = options.bigMessageDelay || this.defaultOptions.bigMessageDelay
    this.sendMessageStatusDelay = options.sendMessageStatusDelay || this.defaultOptions.sendMessageStatusDelay
    this.waitForPendingRequest = options.waitForPendingRequest || this.defaultOptions.waitForPendingRequest

    this.isPending = false

    this.emittedMessageIndexes = []
    this.token = null
    this.waitingForBigMessage = false
  }

  async apiRequest (path, options = {}) {
    const method = (typeof options.method === 'string' && options.method.toLowerCase()) || 'get'
    const makeRequest = got[method]
    const token = options.token || this.token || await this.getToken()
    const headers = this.getHeaders(token)
    path = path.startsWith('/') ? path.slice(1) : path

    this.setPending(true)

    const body = options.body && toXML({
      request: options.body
    })

    const response = await makeRequest(`http://${this.modemIp}/api/${path}`, {
      headers,
      ...(body && { body })
    })

    if (response.headers.__requestverificationtoken) {
      this.setToken({
        verification: response.headers.__requestverificationtoken
      })
    }

    this.setPending(false)

    const jsonBody = toJSON(response.body)
    const isJsonBody = typeof jsonBody === 'object'
    const jsonResponse = isJsonBody && jsonBody.response
    const errorResponse = isJsonBody && jsonBody.error && { error: jsonBody.error }

    return jsonResponse || errorResponse || response.body
  }

  async waitForPending () {
    return new Promise(resolve => {
      if (this.waitForPendingRequest) {
        const interval = setInterval(() => {
          if (!this.isPending) {
            clearInterval(interval)
            resolve()
          }
        }, 100)
      } else {
        resolve()
      }
    })
  }

  async setToken (token) {
    if (!token) return false

    this.token = {
      ...this.token,
      ...token
    }

    return true
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

  async getMessages (options = {}) {
    await this.waitForPending()
    const types = {
      received: 1,
      sent: 2,
      drafted: 3
    }

    const defaultOptions = {
      count: 20,
      page: 1,
      type: 1,
      ascending: 0,
      unreadPreferred: 0
    }

    const count = (options.count <= defaultOptions.count && options.count) || defaultOptions.count
    const page = options.page || defaultOptions.page
    const type = (options.type && types[options.type]) || defaultOptions.type
    const ascending = options.sort === 'ascending' ? 1 : defaultOptions.ascending
    const unreadPreferred = options.unreadPreferred === true ? 1 : defaultOptions.unreadPreferred

    const response = await this.apiRequest('/sms/sms-list', {
      method: 'post',
      body: {
        Ascending: ascending,
        BoxType: type,
        PageIndex: page,
        ReadCount: count,
        SortType: 0,
        UnreadPreferred: unreadPreferred
      }
    })

    const messages = typeof response === 'object' && response.Messages && response.Messages.Message

    if (!messages) return response

    if (!options.internalFormat) {
      const formattedMessages = Array.isArray(messages) ? messages.map(this.formatMessage) : [this.formatMessage(messages)]
      return formattedMessages
    }

    return response
  }

  async getSmsStatus (receiver, token) {
    await this.waitForPending()
    const parsedReceiver = parseInt(receiver, 10)

    this.setPending(true)

    const response = await this.apiRequest('/sms/send-status', {
      token
    })

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
    const response = await this.apiRequest('/sms/send-sms', {
      token,
      method: 'post',
      body: {
        Index: '-1',
        Phones: {
          Phone: String(receiver)
        },
        Content: String(text),
        Length: String(text).length,
        Reserved: '1',
        Date: createTimeString()
      }
    })

    if (!response || response.error) {
      return {
        success: false,
        error: response.error || response
      }
    }

    if (response === 'OK') {
      const status = await this.getSmsStatus(receiver, token)

      return status
    }

    return {
      success: false,
      receiver
    }
  }

  async onMessage (callback) {
    const initialResponse = await this.getInbox({ count: 20, internalFormat: true })
    const initialMessages = initialResponse && initialResponse.Count > 0 && initialResponse.Messages && initialResponse.Messages.Message
    const initialMessage = initialMessages && initialMessages[0]

    if (!initialMessage) {
      await wait(this.messageDelay)
      return this.onMessage(callback)
    }

    initialMessages.forEach(previousMessage => {
      this.addEmittedIndex(previousMessage.Index)
    })

    await this.getLastMessage(callback)
  }

  async emitMessages (messages, callback) {
    const unemittedMessagesPromises = messages
      .filter(message => !this.emittedMessageIndexes.includes(message.Index))
      .map(message => async () => {
        if (message.Phone === 'MMS') {
          this.addEmittedIndex(message.Index)
          return
        }

        await callback(this.formatMessage(message))
        this.addEmittedIndex(message.Index)
      })

    return promiseSequence(unemittedMessagesPromises)
  }

  async getLastMessage (callback) {
    const [inbox] = await Promise.all([
      this.getInbox({ count: 20, internalFormat: true }),
      wait(this.messageDelay)
    ])

    const messages = inbox.Messages.Message
    const lastMessage = inbox.Messages.Message[0]

    if (lastMessage.SmsType === 2 && this.waitingForBigMessage === false && this.isUnemitted(lastMessage.Index)) {
      this.waitingForBigMessage = true
      return wait(this.bigMessageDelay).then(() => this.getLastMessage(callback))
    }

    this.waitingForBigMessage = false

    const unemittedMessages = messages.filter(msg => this.isUnemitted(msg.Index))

    if (unemittedMessages.length > 0) {
      await this.emitMessages(unemittedMessages, callback)
    }

    return this.getLastMessage(callback)
  }

  setPending (boolean) {
    this.isPending = Boolean(boolean)
  }

  getHeaders (token) {
    const headers = {
      __RequestVerificationToken: token.verification,
      Cookie: `SessionID=${token.session}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest'
    }

    return headers
  }

  isUnemitted (index) {
    return !this.emittedMessageIndexes.includes(index)
  }

  addEmittedIndex (indexes) {
    this.emittedMessageIndexes = [
      ...this.emittedMessageIndexes,
      ...(Array.isArray(indexes) ? indexes : [indexes])
    ]
  }

  formatMessage (message) {
    return {
      id: message.Index,
      sender: String('+' + message.Phone),
      text: String(message.Content),
      createdAt: String(message.Date)
    }
  }
}

module.exports = Modem
