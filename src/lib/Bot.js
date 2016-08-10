import Botkit from 'botkit'
import Yelp from './Yelp'
import {searchHandler, startVoteEvent, listRestaurantList, finalizeList} from '../helpers/BotHelpers'
import MongoDB from 'botkit-storage-mongo'
import Channel from '../models/Channel'

const mongoStorage = new MongoDB({mongoUri: 'mongodb://localhost:27017/foodbot'})

const botController = Botkit.slackbot({
	storage: mongoStorage,
	interactive_replies: true
}).configureSlackApp(
  {
  	clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scopes: ['bot', 'users:read'],
  }
)

botController.setupWebserver(process.env.PORT, (err,webserver) => {
	botController.createWebhookEndpoints(botController.webserver)
	botController.createOauthEndpoints(botController.webserver, (err,req,res) => {
	    if (err) {
	    	res.status(500).send('ERROR: ' + err)
	    } else {
	    	res.send('Successfully authenticated! Foodbot has joined your team!')
	    }
	})
})

botController.on('channel_joined', (bot, message) => {
	bot.api.channels.info({channel: message.channel.id}, (err, res) => {
		let channel = res.channel
		let cChannel = new Channel({id: channel.id, _name: channel.name, _members: channel.members})
		botController.storage.channels.save(cChannel)
	})
})

//ALL THESE IF CONDITIONALS SHOULD BE MOVED OUT
botController.on('interactive_message_callback', (bot, message) => {
	//LOGIC FOR HANDLING USER JOINING AN EVENT
	if (message.callback_id == 'joinEvent'){
		botController.storage.channels.get(message.channel, (err, data) => {
			let payload = JSON.parse(message.payload)
			let channel = Channel.toObj(data)
			let voteEvent = channel.getVoteEvent()
			if (message.actions[0].value == 'yes'){
				voteEvent.addVoter(payload.user.id)
			} else if (message.actions[0].value == 'no')
			{
				voteEvent.removeVoter(payload.user.id)
			}
			botController.storage.channels.save(channel)
		})
	}

	//LOGIC FOR HANDLING ADDING RESTAURANT TO LIST VIA ACTION BUTTONS
	if (message.callback_id == 'addRestaurant') {
		botController.storage.channels.get(message.channel, (err, data) => {
			let payload = JSON.parse(message.payload)
			let channel = Channel.toObj(data)
			let voteEvent = channel.getVoteEvent()
			try {
				let attachments = message.original_message.attachments
				let restaurant = message.actions[0].name
				console.log(restaurant)
				let restaurantData = message.actions[0].value
				if (voteEvent.getListFinalized()){
					bot.api.chat.update({as_user: true, ts: message.original_message.ts, channel: message.channel, text: "You've already finalized the list. You can't edit it anymore."})
				} else if (! voteEvent.getRestaurants()[restaurant]){
					voteEvent.addRestaurant(restaurant, restaurantData)
					attachments[parseInt(message.attachment_id) - 1].title = `${restaurant} *Added to List* `
					bot.api.chat.update({as_user: true, ts: message.original_message.ts, channel: message.channel, attachments: JSON.stringify(attachments)})
				} else {
					bot.api.chat.update({as_user: true, ts: message.original_message.ts, channel: message.channel, text: `${restaurant} already added to list.`})
				}
			} 
			catch (e){
				console.log(e)
			}
			botController.storage.channels.save(channel, (err)=> console.log(err))
		})
	}

	//LOGIC FOR HANDLING VOTING FOR RESTAURANT IN LIST VIA ACTION BUTTONS
	if (message.callback_id == 'castVote') {
		botController.storage.channels.get(message.channel, (err, data) => {
			let payload = JSON.parse(message.payload)
			let channel = Channel.toObj(data)
			let voteEvent = channel.getVoteEvent()
			try {
				let attachments = message.original_message.attachments
				let restaurant = message.actions[0].name
				console.log(voteEvent.getRestaurants())
				console.log(restaurant)
				if (voteEvent.getRestaurants()[restaurant]){
					voteEvent.addVote(message.user, restaurant)
					bot.api.chat.update({as_user: true, ts: message.original_message.ts, channel: message.channel, text: `Voting for ${restaurant}.`}, (err) => console.log(err))
				} else {
					console.log('Something went wrong.')
				}
			} 
			catch (e){
				console.log(e)
			}
			botController.storage.channels.save(channel, (err)=> console.log(err))
		})
	}

})



botController.hears('start vote', ['direct_message', 'direct_mention'], startVoteEvent)

botController.hears('search', ['direct_message', 'direct_mention'], searchHandler)

botController.hears('list', ['direct_message', 'direct_mention'], listRestaurantList)

botController.hears('finalize', ['direct_message', 'direct_mention'], finalizeList)

export default botController