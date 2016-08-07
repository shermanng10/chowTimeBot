import botController from './lib/Bot'
import dotenv from 'dotenv'
dotenv.config()

// Store initialized bots in a map so that no additional RTM connections are made on create_bot
let _bots = {}

function trackBot(bot){
		_bots[bot.config.token] = bot
}

// Used to spawn past RTM connections in the event that App needs to be restarted.
botController.storage.teams.all((err, teams) => {
	if (err){
		throw new Error(err)
	}
	console.log(teams)
	for (let t in teams){
		if (teams[t].bot){
			botController.spawn({token: teams[t].token}).startRTM((err, bot)=> {
				if (err){
					console.log('Error connecting bot to Slack:', err)
				} else {
					trackBot(bot)
				}
			})
		}
	}
})

// This gets fired after every successful oauth login.
botController.on('create_bot', (bot,team) => {
	if (_bots[bot.config.token]) {
		console.log("already online! do nothing.")
	}
	else {
		bot.startRTM((err) => {
			if (err) {
				console.log("RTM failed")
			}
			else {
				console.log("RTM ok")
				trackBot(bot)
				botController.saveTeam(team, (err, id) => {
					if (err) {
						console.log("Error saving team")
					}
					else {
						console.log("Team saved")
					}
				})
			}

			bot.startPrivateConversation({user: team.createdBy}, (err,convo) => {
				if (err) {
					console.log(err)
				} else {
					convo.say("I am a bot that has just joined your team ask me for help by typing '@foodbot help'")
				}
			})
		})
	}
})
