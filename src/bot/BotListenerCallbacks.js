import botController from './Bot'
import Yelp from '../lib/Yelp'
import Channel from '../models/Channel'
import { timeout } from '../lib/FunctionLib'
import { getSearchTerms, buildAttachment, buildMessage, buildAction } from '../lib/MessageHelpers'
import { getChannelFromDB, botReply, botSay, botChatUpdate, botGetUserInfo } from './BotHelpers'

const yelp = new Yelp()

async function unknownCommandHandler(bot, srcMsg){
  let message = `I didn't understand that command, you can view a list of my commands by typing *'@foodbot help'*`
  try {
    let channelInfo = await getChannelFromDB(bot, srcMsg)
    let channel = channelInfo.channel
  } catch(e) {
    message = e.message
  }
  botReply(bot, srcMsg, message)
}

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

async function closeVote(bot, srcMsg, botReply) {
  try {
    let channelInfo = await getChannelFromDB(bot, srcMsg)
    let channel = channelInfo.channel
    let voteEvent = channelInfo.voteEvent
    let message_text = '*Not enough users joined the vote! At least one person needs to join.*'
    let lunchLeader = voteEvent.randomizeLeader()
    voteEvent.entryClosed()
    botController.storage.channels.save(channel)
    botChatUpdate(bot, {
      as_user: true,
      ts: botReply.ts,
      channel: botReply.channel,
      text: '*Voting has closed!*',
      attachments: '[]'
    })
      .then(() => botGetUserInfo(bot, lunchLeader))
      .then(data => message_text = `*${data.user.name} has been randomly selected as the lunch leader!*`)
      .catch((err)=> console.log(err))
      .then(() => {
        botSay(bot, {
          text: message_text,
          channel: botReply.channel,
        })
      })
  } catch (e) {
    botReply(bot, srcMsg, e.message)
  }
}

async function startVoteHandler(bot, srcMsg) {
  try {
    let channelInfo = await getChannelFromDB(bot, srcMsg)
    let channel = channelInfo.channel
    channel.startVoteEvent()
    let voteEvent = channel.voteEvent
    let yesAction = buildAction({
      name: "yes",
      text: "Yes",
      value: "yes",
      style: "primary",
      type: "button"
    })
    let noAction = buildAction({
      name: "no",
      text: "No",
      value: "no",
      style: "danger",
      type: "button"
    })
    let attachment = buildAttachment({
      title: 'A lunch event has been started! Please confirm within 5 minutes if you would like to be part of the vote.',
      callback_id: 'joinEvent',
      attachment_type: 'default',
      actions: [yesAction, noAction]
    })
    let msg = buildMessage({
      text: '',
      channel: srcMsg.channel,
      attachments: [attachment]
    })
    botController.storage.channels.save(channel)
    botSay(bot, msg)
      .then((resMsg) => timeout(7000)
        .then(() => closeVote(bot, srcMsg, resMsg))
    )
  } catch (e) {
    botReply(bot, srcMsg, e.message)
  }
}

function buildSearchResponse(srcMsg, searchParams, channelInfo) {
  try {
    return yelp.getRestaurants(searchParams).then((restaurantArray) => {
      let attachmentArray = []
      for (let restaurant of restaurantArray) {
        let restaurantName = restaurant.name.replace('.', '')
        let restaurantRating = restaurant.rating
        let restaurantUrl = restaurant.url
        let addAction = buildAction({
          name: "add",
          text: "Add to List",
          type: "button",
          style: "primary",
          value: `{"name": "${restaurantName}", "url": "${restaurantUrl}", "rating": "${restaurantRating}"}`
        })
        let removeAction = buildAction({
          name: "remove",
          text: "Remove from List",
          type: "button",
          style: "danger",
          value: `{"name": "${restaurantName}", "url": "${restaurantUrl}", "rating": "${restaurantRating}"}`
        })
        let attachment = buildAttachment({
          title: `${restaurantName} (${restaurantRating}/5 Stars)`,
          title_link: restaurantUrl,
          callback_id: 'editList',
          attachment_type: "default",
          actions: [addAction, removeAction]
        })
        if (!channelInfo.voteEvent || srcMsg.user != channelInfo.voteEvent.getLunchLeader()) {
          delete attachment["actions"]
        }
        attachmentArray.push(attachment)
      }
      return buildMessage({
        text: '',
        attachments: attachmentArray
      })
    })
  } catch (e) {
    botReply(bot, srcMsg, e.message)
  }
}

async function searchHandler(bot, srcMsg) {
  try {
    let channelInfo = await getChannelFromDB(bot, srcMsg)
    let searchParams = getSearchTerms(srcMsg)
    buildSearchResponse(srcMsg, searchParams, channelInfo)
      .then(messageResponse => botReply(bot, srcMsg, messageResponse))
  } catch (e) {
    botReply(bot, srcMsg, e.message)
  }
}

function finalizeList(bot, srcMsg, channel, voteEvent) {
  return new Promise((resolve, reject) => {
    if (!voteEvent || srcMsg.user != voteEvent.getLunchLeader()) {
      reject(botReply(bot, srcMsg, "*You either aren't the lunch leader or there is no vote event going on right now.*"))
    } else if (srcMsg.user == voteEvent.getLunchLeader()) {
      voteEvent.listFinalized()
      botController.storage.channels.save(channel)
      resolve()
    }
  })
}

async function getWinner(bot, srcMsg) {
  try {
    let channelInfo = await getChannelFromDB(bot, srcMsg)
    let channel = channelInfo.channel
    let voteEvent = channelInfo.voteEvent
    voteEvent.voteClosed()
    botController.storage.channels.save(channel)
    botSay(bot, {
      text: `*${voteEvent.getWinner()} is the winning restaurant!*`,
      channel: srcMsg.channel
    })
  } catch(e) {
    botReply(bot, srcMsg, e.message)
  }
}

async function finalizeListHandler(bot, srcMsg) {
  try {
    let channelInfo = await getChannelFromDB(bot, srcMsg)
    let channel = channelInfo.channel
    let voteEvent = channelInfo.voteEvent
    finalizeList(bot, srcMsg, channel, voteEvent)
      .then(() => {
        botSay(bot, {
          text: "*The list of restaurants have been finalized, you have 10 minutes to vote for your favorite.*",
          channel: srcMsg.channel
        })
      })
      .then(() => timeout(7000))
      .then(() => getWinner(bot, srcMsg))
  } catch (e) {
    botReply(bot, srcMsg, e.message)
  }
}

async function listRestaurantHandler(bot, srcMsg) {
  try {
    let channelInfo = await getChannelFromDB(bot, srcMsg)
    let channel = channelInfo.channel
    let voteEvent = channelInfo.voteEvent
    if (voteEvent) {
      let attachmentArray = []
      let restaurants = voteEvent.getRestaurants()
      for (let restaurantName in restaurants) {
        let restaurantData = restaurants[restaurantName]
        let restaurantRating = restaurantData['rating']
        let restaurantUrl = restaurantData['url']
        let attachment = buildAttachment({
          title: `${restaurantName} (${restaurantRating}/5 Stars)`,
          callback_id: 'castVote',
          title_link: restaurantUrl,
          attachment_type: 'default',
          actions: [{
            "name": restaurantName,
            "text": "Cast Vote",
            "value": restaurantName,
            "type": "button",
          }]
        })
        if (voteEvent.getLunchLeader() == srcMsg.user && !voteEvent.getListFinalized()){
          attachment["callback_id"] = 'editList'
          attachment["actions"] = [buildAction({
            name: "remove",
            text: "Remove from List",
            type: "button",
            style: "danger",
            value: `{"name": "${restaurantName}", "url": "${restaurantUrl}", "rating": "${restaurantRating}"}`
          })]
        }
        if (!voteEvent.getLunchLeader() == srcMsg.user && !voteEvent.getListFinalized()){
          delete attachment["actions"]
        }
        attachmentArray.push(attachment)
      }
      botReply(bot, srcMsg, {
        text: "*List of Restaurants in the Running:*",
        attachments: attachmentArray
      })
    } else {
      botReply(bot, srcMsg, "*There isn't an active vote, so theres nothing to list.*")
    }
  } catch (e) {
    botReply(bot, srcMsg, e.message)
  }
}

export { unknownCommandHandler, helpHandler, searchHandler, startVoteHandler, listRestaurantHandler, finalizeListHandler }