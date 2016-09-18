import botController from './bot/Bot'
import Promise from 'bluebird'
import dotenv from 'dotenv'
dotenv.config()

// Store initialized bots in a map so that no additional RTM connections are made on create_bot
let _bots = {}

function handleSpawnedBot(bot) {

  // track the initialized bot into the map
  _bots[bot.config.token] = bot

  // Promisify every method within spawned bots and slack api worker. Not my loving it,
  // but much cleaner than when I individually wrote Promise wrappers for every function. 
  Promise.promisifyAll(bot)

  for (const apiGroup in bot.api){

    if (typeof(bot.api[apiGroup]) === 'object') {
      Promise.promisifyAll(bot.api[apiGroup])
    }

  }

}

// Used to spawn past RTM connections in the event that App needs to be restarted.
botController.storage.teams.all((err, teams) => {

  if (err) {
    throw new Error(err)
  }

  for (const t in teams) {

    if (teams[t].bot) {
      botController.spawn({
        token: teams[t].token
      }).startRTM((err, bot) => {

        if (err) {
          console.log('Error connecting bot to Slack:', err)
        } else {
          handleSpawnedBot(bot)
        }

      })
    }

  }
})

// This gets fired after every successful oauth login.
botController.on('create_bot', (bot, team) => {

  if (_bots[bot.config.token]) {
    console.log("already online! do nothing.")
  } else {
    bot.startRTM((err) => {

      if (err) {
        console.log("RTM failed")
      } else {
        console.log("RTM ok")
        handleSpawnedBot(bot)
      }

      bot.startPrivateConversation({
        user: team.createdBy
      }, (err, convo) => {

        if (err) {
          console.log(err)
        } else {
          convo.say("I am a bot that has just joined your team ask me for help by typing '@foodbot help'")
        }

      })
    })
  }
})
