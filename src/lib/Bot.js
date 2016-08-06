import Botkit from 'botkit'

const botController = Botkit.slackbot({
	json_file_store: './database/'
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

export default botController