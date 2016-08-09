import Botkit from 'botkit'
import Yelp from './Yelp'
import {searchHandler, startVoteEvent} from '../helpers/BotHelpers'
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

botController.on('interactive_message_callback', (bot, message) => {
	if (message.callback_id == 'joinEvent'){
		botController.storage.channels.get(message.channel, (err, data) => {
			let payload = JSON.parse(message.payload)
			let channel = Channel.toObj(data)
			let voteEvent = channel.getVoteEvent()
			if (message.actions[0].value == 'yes'){
				voteEvent.addVoter(payload.user.id)
			} else if (message.actions[0]. value == 'no')
			{
				voteEvent.removeVoter(payload.user.id)
			}
			botController.storage.channels.save(channel)
		})
	}
})



botController.hears('start vote', ['direct_message', 'direct_mention'], startVoteEvent)

botController.hears('search', ['direct_message', 'direct_mention'], searchHandler)

export default botController