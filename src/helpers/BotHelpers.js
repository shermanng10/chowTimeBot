import MessageParser from '../helpers/MessageParser'
import botController from '../lib/Bot'
import Yelp from '../lib/Yelp'
import VoteEvent from '../models/VoteEvent'
import Channel from '../models/Channel'

const yelp = new Yelp()

function searchHandler(bot, message){
	try {
		let searchParams = MessageParser.getSearchTerms(message)
		yelp.getRestaurants(searchParams).then((dataArray) => { 
			botController.storage.channels.get(message.channel, (err, data) => {
				console.log(data)
				let channel = Channel.toObj(data)
				let voteEvent = channel.getVoteEvent()
				if (message.user != voteEvent.getLunchLeader()){
					for (let restaurant of dataArray){
						bot.reply(message, restaurant.name)
					}
				} else {
					bot.reply(message, 'you da leader')
				}
			})
		})
	} catch (e){
		bot.reply(message, e.message)
	}
}

function startVoteEvent(bot, message){
	botController.storage.channels.get(message.channel, (err, data) => { 
		let channel = Channel.toObj(data).startVoteEvent()
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

export {searchHandler, startVoteEvent}