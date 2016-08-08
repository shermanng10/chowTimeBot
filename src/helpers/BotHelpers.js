import MessageParser from '../helpers/MessageParser'
import botController from '../lib/Bot'
import Yelp from '../lib/Yelp'

const yelp = new Yelp()

function searchHandler(bot, message){
	try {
		let searchParams = MessageParser.getSearchTerms(message)
		yelp.getRestaurants(searchParams).then((dataArray) => { 
			for (let restaurant of dataArray) {
				bot.reply(message, restaurant.name)
			}
		})
	} catch (e){
		bot.reply(message, e.message)
	}
}

function randomizeTeamLeader(bot, message){

}

export {searchHandler}