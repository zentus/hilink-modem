# hilink-modem

A node.js wrapper around the Huawei HiLink REST API

## Setup

```bash
npm install hilink-modem
```

## Usage

```javascript
const Modem = require('hilink-modem')

const modem = new Modem()

modem.sendMessage({
  receiver: '+46123456789',
  text: 'Hello from node world!'
}).then(status => console.log(status))
```

### API

#### new Modem(options)

Type: `function`

Returns an instance of `Modem`

##### options

Type: `object`

| Option                     | Default | Type    | Description                                                                                                                                                                                          |
|----------------------------|---------------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| modemIp                | `192.168.8.1`   | `string`  | The IP address of the modem                                                                                                                                                                   |
| messageDelay           | `1`             | `number`  | The number of seconds to wait between looking for new messages in Modem.onMessage                                                                                                                  |
| bigMessageDelay        | `30`            | `number`  | The number of seconds to wait before looking for a new message after first receiving a multi-part SMS (The HiLink API initially returns scrambled messages after first receiving a multi-part SMS) |
| sendMessageStatusDelay | `1`             | `number`  | The number of seconds to wait between checking status of message sent with Modem.sendMessage                                                                                                       |
| waitForPendingRequest  | `true`          | `boolean` | If a new request is started while there is a pending request to the API, the new request will not be executed until the pending request is no longer pending                                       |


#### Modem.sendMessage(options)

Type: `function`

Returns a `Promise`

Send an SMS text message

```javascript
modem.sendMessage({
  receiver: '+46123456789',
  text: 'Hello from node world!'
}).then(status => console.log(status))
```

##### options

Type: `object`

| Option   | Type     | Description                          |
|----------|----------|--------------------------------------|
| receiver | `string` | The telephone number of the receiver |
| text     | `string` | The text of the message              |


#### Modem.getMessages(options)

Type: `function`

Returns a `Promise`

Get SMS text messages

```javascript
modem.getMessages({type: 'received'})
	.then(messages => console.log(messages))

modem.getMessages({type: 'sent'})
	.then(messages => console.log(messages))

modem.getMessages({type: 'drafted'})
	.then(messages => console.log(messages))
```

##### options

Type: `object`

| Option | Default     | Type     | Allowed values             | Description                   |
|--------|-------------|----------|-----------------------------|-------------------------------|
| type   | `received`  | `string` |`received`\|`sent`\|`drafted`| The mailbox to get messages from |
| count  | `20`        | `number` | `1` to `20`                 | The number of messages to get |
| page   | `1`         | `number` | `1` to `{pageCount}`        | The page to get messages from |
| sort   | `ascending` | `string` | `ascending`\|`descending`   | The sort direction            |


#### Modem.onMessage(callback)

Type: `function`

Start listening for incoming SMS text messages

```javascript
modem.onMessage(message => {
  console.log('recieved message:', message)
})
```

##### callback

Type: `function`

A callback function that will be called when a new message is received. Async functions are supported


#### Modem.apiRequest(endpoint, options)

Type: `function`

Returns a `Promise`

Make a custom request to the HiLink API, with tokens provided.

If you use this to write a method not covered by this package, feel free to make a PR!

```javascript
modem.apiRequest('/sms/sms-count').then(console.log)
```

##### endpoint

Type: `string`

The endpoint to request. Will be prepended with `/api`

##### options

Type: `object`

| Option | Default     | Type     | Allowed values                                       | Description              |
|--------|-------------|----------|------------------------------------------------------|--------------------------|
| method | `GET`       | `string` | `GET`\|`POST`\|`PUT`\|`PATCH`\|`HEAD`\|`DELETE`      | The request method       |
| body   | `undefined` | `object` |                                                      | The request body in JSON |

The HiLink API only accepts XML. `body` will be converted to XML, see example below.

From this:

```javascript
const body = {
  Ascending: 1,
  BoxType: 1,
  PageIndex: 1,
  ReadCount: 20,
  SortType: 0,
  UnreadPreferred: 1
}
```

To this:

```xml
<?xml version="1.0" encoding="utf-8"?>
<request>
   <Ascending>1</Ascending>
   <BoxType>1</BoxType>
   <PageIndex>1</PageIndex>
   <ReadCount>20</ReadCount>
   <SortType>0</SortType>
   <UnreadPreferred>1</UnreadPreferred>
</request>
```

## Devices

See https://github.com/zentus/hilink-modem/blob/master/devices.md

## License

[MIT](https://github.com/zentus/hilink-modem/blob/master/LICENSE)
