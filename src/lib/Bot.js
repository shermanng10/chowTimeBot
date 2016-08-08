import Botkit from 'botkit'
import Yelp from './Yelp'
import {searchHandler} from '../helpers/BotHelpers'
import MongoDB from 'botkit-storage-mongo'
import Channel from '../models/Channel'

const mongoStorage = new MongoDB({mongoUri: 'mongodb://localhost:27017/foodbot'})

const botController = Botkit.slackbot({
	storage: mongoStorage
}).configureSlackApp(
  {
  	clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scopes: ['bot'],
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
		let cChannel = new Channel({id: channel.id, name: channel.name, members: channel.members})
		botController.storage.channels.save(cChannel)
	})
})


botController.hears('search', ['direct_message', 'direct_mention'], searchHandler)

export default botController