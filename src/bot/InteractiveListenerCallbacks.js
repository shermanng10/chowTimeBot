import botController from './Bot'
import { getChannelFromDB, botReply, botSay, botChatUpdate, botGetUserInfo } from './BotHelpers'

async function helpHandler(bot, srcMsg) {
  let message = `Hi, I'm a bot that can help your team find, select and vote on where to eat lunch.
\ *To start a vote*: use the command '@foodbot start vote'. Once a vote has started team members can opt into the vote\
\   within the alloted time and after, a leader is chosen at random. 
\ *To search for restaurants*: use the command '@foodbot search [search terms] : [location]'. If you are the leader of the vote\
\   you have the option of adding or removing the results to the lunch list. 
\ *To view list of voting options*: use the command '@foodbot list'. 
\ *To finalize list of options*: use the command '@foodbot finalize' (only works for leader).`
  try {
    let channelInfo = await getChannelFromDB(bot, srcMsg)
    let channel = channelInfo.channel
  } catch(e) {
    message = e.message
  }
  botReply(bot, srcMsg, message)
}

async function joinEventHandler(bot, srcMsg){
  try {
    let channelInfo = await getChannelFromDB(bot, srcMsg)
    let channel = channelInfo.channel
    let voteEvent = channelInfo.voteEvent
    let payload = JSON.parse(srcMsg.payload)
    let response_text = ""
    console.log(srcMsg)
    if (srcMsg.actions[0].value == 'yes') {
      voteEvent.addVoter(payload.user.id)
      response_text = "*You've joined the lunch event!*"
    } else if (srcMsg.actions[0].value == 'no') {
      voteEvent.removeVoter(payload.user.id)
      response_text = "*You've removed yourself from the lunch event!*"
    }
    botChatUpdate(bot, {
      as_user: true,
      ts: srcMsg.original_message.ts,
      channel: srcMsg.channel,
      text: response_text
    })
    botController.storage.channels.save(channel)
  }
  catch(e) {
    botReply(bot, srcMsg, `*${e.message}*`)
  }
}

async function editListHandler(bot, srcMsg){
  try {
    let channelInfo = await getChannelFromDB(bot, srcMsg)
    let channel = channelInfo.channel
    let voteEvent = channelInfo.voteEvent
    let action = srcMsg.actions[0].name
    let restaurantData = JSON.parse(srcMsg.actions[0].value)
    let restaurantName = restaurantData["name"]
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
    botChatUpdate(bot, {
      as_user: true,
      ts: srcMsg.original_message.ts,
      channel: srcMsg.channel,
      text: response_text
    })
    botController.storage.channels.save(channel)
  } catch (e) {
    botReply(bot, srcMsg, `*${e.message}*`)
  }
}

async function castVoteHandler(bot, srcMsg){
  try {
    let channelInfo = await getChannelFromDB(bot, srcMsg)
    let channel = channelInfo.channel
    let voteEvent = channelInfo.voteEvent
    let attachments = srcMsg.original_message.attachments
    let restaurant = srcMsg.actions[0].name
    let response_text = ""
    let voteClosed = voteEvent.getVoteClosed()
    if (!voteClosed && voteEvent.getRestaurants()[restaurant]) {
      voteEvent.addVote(srcMsg.user, restaurant)
      botController.storage.channels.save(channel)
      response_text = `*You are now voting for ${restaurant}.*`
    } 
    else if (voteClosed){
      response_text = `*The vote has ended already!*`
    }
    botChatUpdate(bot, {
      as_user: true,
      ts: srcMsg.original_message.ts,
      channel: srcMsg.channel,
      text: response_text
    })
  } catch (e) {
    botReply(bot, srcMsg, `*${e.message}*`)
  }
}

export { joinEventHandler, editListHandler, castVoteHandler, helpHandler}
