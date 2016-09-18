import Botkit from 'botkit'
import { unknownCommandHandler, helpHandler, searchHandler, startVoteHandler, listRestaurantHandler, finalizeListHandler } from './BotListenerCallbacks'
import { joinEventHandler, editListHandler, castVoteHandler } from './InteractiveListenerCallbacks'
import { getChannelFromDB } from './BotHelpers'
import MongoDB from 'botkit-storage-mongo'
import Channel from '../models/Channel'

const mongoStorage = new MongoDB({
  mongoUri: 'mongodb://localhost:27017/foodbot'
})

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

botController.setupWebserver(process.env.PORT, (err, webserver) => {

  botController.createWebhookEndpoints(botController.webserver)

  botController.createOauthEndpoints(botController.webserver, (err, req, res) => {

    if (err) {
      res.status(500).send('ERROR: ' + err)
    } else {
      res.send('Successfully authenticated! Foodbot has joined your team!')
    }

  })

})

botController.on('channel_joined', (bot, message) => {
  bot.api.channels.infoAsync({ channel: message.channel.id }).then(info => {
    console.log(info)
    const cChannel = new Channel({
      id: info.channel.id,
      _name: info.channel.name,
      _members: info.channel.members
    })
    botController.storage.channels.save(cChannel)

  })
})


botController.on('interactive_message_callback', (bot, message) => {

  if (message.callback_id == 'joinEvent') {
    joinEventHandler(bot, message)
  } else if (message.callback_id == 'editList') {
    editListHandler(bot, message)
  } else if (message.callback_id == 'castVote') {
    castVoteHandler(bot, message)
  }

})

botController.hears('help', ['direct_mention'], helpHandler)

botController.hears('start vote', ['direct_mention'], startVoteHandler)

botController.hears('search', ['direct_mention'], searchHandler)

botController.hears('list', ['direct_mention'], listRestaurantHandler)

botController.hears('finalize', ['direct_mention'], finalizeListHandler)

botController.hears('([^\s]+)', ['direct_mention'], unknownCommandHandler)

export default botController