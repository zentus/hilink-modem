const xmlParser = require('fast-xml-parser')
const JsonParser = xmlParser.j2xParser
const jsonParser = new JsonParser()

const XML_LEADING_STRING = `<?xml version="1.0" encoding="utf-8"?>`

const toXML = json => {
	if (typeof json !== 'object') {
		return json
	}

	return `${XML_LEADING_STRING}${jsonParser.parse(json)}`
}

const toJSON = xml => {
	if (typeof xml !== 'string' || !xml.trim().toLowerCase().startsWith(XML_LEADING_STRING)) {
		return xml
	}

	return xmlParser.parse(xml.replace(XML_LEADING_STRING, ''))
}

const createTimeString = () => new Date()
	.toISOString()
	.replace(/T/, ' ')
	.replace(/\..+/, '')

const wait = seconds => new Promise(resolve => setTimeout(() => resolve(), seconds * 1000))

module.exports = {
	toJSON,
	toXML,
	createTimeString,
	wait
}
