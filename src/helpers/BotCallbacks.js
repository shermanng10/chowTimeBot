import MessageParser from '../helpers/MessageParser'
import Yelp from '../lib/Yelp'

const yelp = new Yelp()

function searchHandler(bot, message){
	try {
		let searchParams = MessageParser.getSearchTerms(message)
		yelp.getRestaurants(searchParams).then((data) =>{console.log(data)})
	} catch (e){
		bot.reply(message, e.message)
	}
}


export {searchHandler}