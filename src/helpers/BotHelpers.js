import MessageParser from '../helpers/MessageParser'
import botController from '../lib/Bot'
import Yelp from '../lib/Yelp'
import VoteEvent from '../models/VoteEvent'
import Channel from '../models/Channel'

const yelp = new Yelp()

function _tallyVotes(votes){

}

function _endVoting(){
	botController.storage.channels.get(message.channel, (err, data) => {
		let channel = Channel.toObj(data)
		let voteEvent = channel.getVoteEvent()
		voteEvent.voteClosed()
		botController.storage.channels.save(channel)
	})
}

function finalizeList(bot, message, cb){
	botController.storage.channels.get(message.channel, (err, data) => { 
		let channel = Channel.toObj(data)
		let voteEvent = channel.getVoteEvent()
		if (!voteEvent || message.user != voteEvent.getLunchLeader()){
			bot.reply(message, "You either aren't the lunch leader or there is no vote event going on right now")
		} else if ( message.user == voteEvent.getLunchLeader()){
			voteEvent.listFinalized()
			botController.storage.channels.save(channel)
			bot.say({
		   			text: "The list of restaurants have been finalized, you have 10 minutes to vote for your favorite.",
		   			channel: message.channel}, (err, botReply) => {
	    															setTimeout(() => {
	    																voteEvent.voteClosed()
																		botController.storage.channels.save(channel)
	    																bot.say({
	    																	text: `${voteEvent.getWinner()} is the winning restaurant!`,
	    																	channel: message.channel
	    																})
	    															}, 7000)
	    })														}
	})
}

function searchHandler(bot, message){
	try {
		let searchParams = MessageParser.getSearchTerms(message)
		yelp.getRestaurants(searchParams).then((restaurantArray) => { 
			botController.storage.channels.get(message.channel, (err, data) => {
				let channel = Channel.toObj(data)
				let voteEvent = channel.getVoteEvent()
				let attachmentArray = []
				for (let restaurant of restaurantArray){
					let restaurantName = restaurant.name.replace('.', '')
					let restaurantRating = restaurant.rating
					let restaurantUrl = restaurant.url
					if (!voteEvent || message.user != voteEvent.getLunchLeader()){
						attachmentArray.push({title: `${restaurantName} (${restaurantRating}/5 Stars)`,
							                title_link: restaurantUrl,
							                callback_id: 'addRestaurant',
							                attachment_type: 'default'})
					} else {
						attachmentArray.push({
							                title: `${restaurantName} (${restaurantRating}/5 Stars)`,
							                title_link: restaurantUrl,
							                callback_id: 'addRestaurant',
							                attachment_type: 'default',
							                actions: [
							                    {
							                        "name": restaurantName,
							                        "text": "Add to list",
							                        "value": `{"url": "${restaurantUrl}", "rating": "${restaurantRating}"}`,
							                        "type": "button",
							                    }
							                ]
							            })
						}
				}
				bot.reply(message, { text: '', attachments: attachmentArray }, (err) => {console.log(err)})
			})
		})
	}
	catch (e){
		bot.reply(message, e.message)
	}
}

function listRestaurantList(bot, message){
	botController.storage.channels.get(message.channel, (err, data) => { 
		let channel = Channel.toObj(data)
		let voteEvent = channel.getVoteEvent()
		if (voteEvent){
			let attachmentArray = []
			let restaurants = voteEvent.getRestaurants()
			for (let restaurantName in restaurants){
				let restaurantData = JSON.parse(restaurants[restaurantName])
				let restaurantRating = restaurantData['rating']
				let restaurantUrl = restaurantData['url']
				attachmentArray.push({
										title: `${restaurantName} (${restaurantRating}/5 Stars)`,
										callback_id: 'castVote',
						                title_link: restaurantUrl,
						                attachment_type: 'default',
						                actions: [{
							                        "name": restaurantName,
							                        "text": "Cast Vote",
							                        "value": restaurantName,
							                        "type": "button",
							                    }]
									})
			}
			bot.reply(message, { text: "List of Restaurants in the Running:", attachments: attachmentArray })
		} else {
			bot.reply(message, "There isn't an active vote, so theres nothing to list.")
		}
	})
}

function startVoteEvent(bot, message){
	botController.storage.channels.get(message.channel, (err, data) => { 
		let channel = Channel.toObj(data)
		channel.startVoteEvent()
		botController.storage.channels.save(channel)
	   	bot.say({
	   			text: '',
	   			channel: message.channel,
	        	attachments:[
		            {
		                title: 'A lunch event has been started! Please confirm within 5 minutes if you would like to be part of the vote.',
		                callback_id: 'joinEvent',
		                attachment_type: 'default',
		                actions: [
		                    {
		                        "name":"yes",
		                        "text": "Yes",
		                        "value": "yes",
		                        "type": "button",
		                    },
		                    {
		                        "name":"no",
		                        "text": "No",
		                        "value": "no",
		                        "type": "button",
		                    }
		                ]
		            }
	        ]
	    }, (err, botReply) => {
	    	setTimeout(() => {
	    		bot.api.chat.update({as_user: true, ts: botReply.ts, channel: botReply.channel, text: 'Voting has closed!', attachments: '[]'})
	 			botController.storage.channels.get(message.channel, (err, data) => {
	 				let message_text = 'Not enough users joined the vote! At least one person needs to join.'
	 				let channel = Channel.toObj(data)
	 				let voteEvent = channel.getVoteEvent()
					let lunchLeader = voteEvent.randomizeLeader()
					voteEvent.entryClosed()
					botController.storage.channels.save(channel)
					bot.api.users.info({user: lunchLeader}, (err, data) => {
						if (err) {
							console.log(err)
						} else {
							let userName = data.user.name
							message_text = `${userName} has been randomly selected as the lunch leader!`
						}
						bot.say({text: message_text,
							 channel: botReply.channel,
						})
					})
	 			})
	    	}, 7000)
	    })
	})
}

export {searchHandler, startVoteEvent, listRestaurantList, finalizeList}