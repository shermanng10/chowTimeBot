import botController from './Bot'
import { getChannelFromDB } from './BotHelpers'

export async function helpHandler(bot, srcMsg) {
  let message = `Hi, I'm a bot that can help your team find, select and vote on where to eat lunch.
\ *To start a vote*: use the command '@foodbot start vote'. Once a vote has started team members can opt into the vote\
\   within the alloted time and after, a leader is chosen at random. 
\ *To search for restaurants*: use the command '@foodbot search [search terms] : [location]'. If you are the leader of the vote\
\   you have the option of adding or removing the results to the lunch list. 
\ *To view list of voting options*: use the command '@foodbot list'. 
\ *To finalize list of options*: use the command '@foodbot finalize' (only works for leader).`
  bot.replyAsync(srcMsg, message)
}

export async function joinEventHandler(bot, srcMsg){
  try {
    const { channel , voteEvent } = await getChannelFromDB(bot, srcMsg)
    const payload = JSON.parse(srcMsg.payload)
    let response_text = ""

    if (srcMsg.actions[0].value == 'yes') {
      voteEvent.addVoter(payload.user.id)
      response_text = "*You've joined the lunch event!*"
    } else if (srcMsg.actions[0].value == 'no') {
      voteEvent.removeVoter(payload.user.id)
      response_text = "*You've removed yourself from the lunch event!*"
    }

    bot.api.chat.updateAsync({
      as_user: true,
      ts: srcMsg.original_message.ts,
      channel: srcMsg.channel,
      text: response_text
    })

    botController.storage.channels.save(channel)

  }
  catch(e) {
    bot.replyAsync(srcMsg, `*${e.message}*`)
  }
}

export async function editListHandler(bot, srcMsg){
  try {
    const { channel , voteEvent } = await getChannelFromDB(bot, srcMsg)
    const action = srcMsg.actions[0].name
    const restaurantData = JSON.parse(srcMsg.actions[0].value)
    const restaurantName = restaurantData["name"]
    let finalized = voteEvent.getListFinalized()
    let response_text = ""

    if (action == "add") {

      if (!finalized && !voteEvent.getRestaurants()[restaurantName]) {
        voteEvent.addRestaurant(restaurantName, restaurantData)
        response_text = `*${restaurantName} added to list!.*`
      } else if (!finalized) {
        response_text = `*${restaurantName} already added to list.*`
      }

    } else if (action == "remove") {

      if (!finalized && !voteEvent.getRestaurants()[restaurantName]) {
        response_text = `*${restaurantName} is not in your list.*`
      } else if (!finalized) {
        voteEvent.removeRestaurant(restaurantName)
        response_text = `*${restaurantName} was removed from the list!.*`
      }

    }

    if (finalized) {
      response_text = "*You've already finalized the list. You can't edit it anymore.*"
    }

    bot.api.chat.updateAsync({
      as_user: true,
      ts: srcMsg.original_message.ts,
      channel: srcMsg.channel,
      text: response_text
    })
    botController.storage.channels.save(channel)
  } catch (e) {
    bot.replyAsync(srcMsg, `*${e.message}*`)
  }
}

export async function castVoteHandler(bot, srcMsg){
  try {
    const { channel , voteEvent } = await getChannelFromDB(bot, srcMsg)
    const attachments = srcMsg.original_message.attachments
    const restaurant = srcMsg.actions[0].name
    const voteClosed = voteEvent.getVoteClosed()
    let response_text = ""

    if (!voteClosed && voteEvent.getRestaurants()[restaurant]) {
      voteEvent.addVote(srcMsg.user, restaurant)
      botController.storage.channels.save(channel)
      response_text = `*You are now voting for ${restaurant}.*`
    } 
    else if (voteClosed){
      response_text = `*The vote has ended already!*`
    }

    bot.api.chat.updateAsync({
      as_user: true,
      ts: srcMsg.original_message.ts,
      channel: srcMsg.channel,
      text: response_text
    })
  } catch (e) {
    bot.replyAsync(srcMsg, `*${e.message}*`)
  }
}
