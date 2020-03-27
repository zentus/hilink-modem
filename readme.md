# @zentus/modem

A node.js wrapper around the Huawei HiLink REST API

## Setup

```bash
npm install @zentus/modem
```

## Usage

```javascript
const Modem = require('@zentus/modem')

const modem = new Modem()

modem.sendMessage({
  reciever: '+46123456789',
  text: 'Hello from node world!'
}).then(status => console.log(status))
```

### API

#### new Modem(options)

Type: `function`

Returns an instance of **Modem**

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
  reciever: '+46123456789',
  text: 'Hello from node world!'
}).then(status => console.log(status))
```

##### options

Type: `object`

| Option   | Type     | Description                          |
|----------|----------|--------------------------------------|
| receiver | `string` | The telephone number of the receiver |
| text     | `string` | The text of the message              |


#### Modem.getInbox(options) | Modem.getOutbox(options)

Type: `function`

Returns a `Promise`

Get messages from the Inbox or Outbox

```javascript
modem.getInbox({
  count: 1,
  page: 1,
  sort: 'ascending'
}).then(messages => console.log(messages))

modem.getOutbox({
  count: 1,
  page: 1,
  sort: 'ascending'
}).then(messages => console.log(messages))
```

##### options

Type: `object`

| Option | Default     | Type     | Allowed values             | Description                   |
|--------|-------------|----------|-----------------------------|-------------------------------|
| count  | `20`        | `number` | `1` to `20`                 | The number of messages to get |
| page   | `1`         | `number` | `1` to `{pageCount}`        | The page to get messages from |
| sort   | `ascending` | `string` | `ascending` \| `descending` | The sort direction            |


#### Modem.onMessage(callback)

Type: `function`

Start listening for new messages

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

Make a request to the HiLink API, with tokens provided

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
| method | `get`       | `string` | `get` \| `post` \| `put` \| `patch` \| `head` \| `delete` | The request method       |
| body   | `undefined` | `object` |                                                      | The request body in JSON |

The API accepts only accepts XML. `body` will be converted to XML, see example below.

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

