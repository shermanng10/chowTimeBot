const MessageParser = {
	getSearchTerms(message){
		let messageArray = message.text.replace('search', '').split(':')
		if (message.text.match(/^\S+/)[0] != 'search' || messageArray.length <= 1){
			throw new Error("Please follow the format search format of \"search cuisine/criteria : location\"")
		} else {
			let searchCritera = messageArray[0]
			let location = messageArray[1]
			return {term: searchCritera, location: location}
		}
	}
}

export default MessageParser