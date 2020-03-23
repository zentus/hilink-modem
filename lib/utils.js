const xmlParser = require('fast-xml-parser')
const JsonParser = xmlParser.j2xParser
const jsonParser = new JsonParser()

const XML_LEADING_STRING = `<?xml version="1.0" encoding="UTF-8"?>`

const toXML = json => `${XML_LEADING_STRING}${jsonParser.parse(json)}`

const toJSON = xml => xmlParser.parse(xml.replace(XML_LEADING_STRING, ''))

const createTimeString = () => new Date()
	.toISOString()
	.replace(/T/, ' ')
	.replace(/\..+/, '')

const wait = seconds => new Promise(resolve => setTimeout(() => resolve(), seconds * 1000))

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

module.exports = {
	asyncForEach,
	toJSON,
	toXML,
	createTimeString,
	wait
}
