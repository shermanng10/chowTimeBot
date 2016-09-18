import botController from './Bot'
import Yelp from '../utils/Yelp'
import Channel from '../models/Channel'
import { timeout } from '../utils/FunctionHelpers'
import { getSearchTerms, buildAttachment, buildMessage, buildAction } from '../utils/MessageHelpers'
import { getChannelFromDB } from './BotHelpers'

const yelp = new Yelp()

export function unknownCommandHandler(bot, srcMsg) {
  const message = `I didn't understand that command, you can view a list of my commands by typing *'@foodbot help'*`
  bot.replyAsync(srcMsg, message)
}

export function helpHandler(bot, srcMsg) {
  const message = `Hi, I'm a bot that can help your team find, select and vote on where to eat lunch.
 *To start a vote*: use the command '@foodbot start vote'. Once a vote has started team members can opt into the vote   within the alloted time and after, a leader is chosen at random. 
 *To search for restaurants*: use the command '@foodbot search [search terms] : [location]'. If you are the leader of the vote   you have the option of adding or removing the results to the lunch list. 
 *To view list of voting options*: use the command '@foodbot list'. 
 *To finalize list of options*: use the command '@foodbot finalize' (only works for leader).`
  bot.replyAsync(srcMsg, message)
}

async function closeVote(bot, srcMsg, botReply) {
  try {
    const {channel, voteEvent} = await getChannelFromDB(bot, srcMsg)
    const lunchLeader = voteEvent.randomizeLeader()
    let message_text = '*Not enough users joined the vote! At least one person needs to join.*'

    voteEvent.entryClosed()

    if (!lunchLeader) voteEvent.voteClosed()

    botController.storage.channels.save(channel)

    // console.log(bot.api)
    bot.api.chat.updateAsync({
      as_user: true,
      ts: botReply.ts,
      channel: botReply.channel,
      text: '*Voting has closed!*',
      attachments: '[]'
    })
      .then(() => {

        if (lunchLeader) {
          return bot.api.users.infoAsync({
            user: lunchLeader
          })
            .then(data => {
              return message_text = `*${data.user.name} has been randomly selected as the lunch leader!*`
            })
        } else {
          return Promise.resolve()
        }

      })
      .then(() => {
        return bot.sayAsync({
          text: message_text,
          channel: botReply.channel,
        })
      })
      .catch(e => {
        console.log(e.message)
      })

  } catch (e) {
    bot.replyAsync(srcMsg, e.message)
  }
}

export async function startVoteHandler(bot, srcMsg) {
  try {
    const {channel, voteEvent} = await getChannelFromDB(bot, srcMsg)

    channel.startVoteEvent()

    const yesAction = buildAction({
      name: "yes",
      text: "Yes",
      value: "yes",
      style: "primary",
    })

    const noAction = buildAction({
      name: "no",
      text: "No",
      value: "no",
      style: "danger",
    })

    const attachment = buildAttachment({
      title: 'A lunch event has been started! Please confirm within 5 minutes if you would like to be part of the vote.',
      callback_id: 'joinEvent',
      actions: [yesAction, noAction]
    })

    const msg = buildMessage({
      channel: srcMsg.channel,
      attachments: [attachment]
    })

    botController.storage.channels.save(channel)

    bot.sayAsync(msg)
      .then(resMsg => timeout(7000)
        .then(() => closeVote(bot, srcMsg, resMsg))
    )

  } catch (e) {
    bot.replyAsync(srcMsg, e.message)
  }
}

function buildSearchResponse(srcMsg, searchParams, channelInfo) {
  return yelp.getRestaurants(searchParams)
    .then(restaurantArray => {
      const attachmentArray = []

      for (const restaurant of restaurantArray) {
        const restaurantName = restaurant.name.replace('.', '')
        const restaurantRating = restaurant.rating
        const restaurantUrl = restaurant.url

        const addAction = buildAction({
          name: "add",
          text: "Add to List",
          style: "primary",
          value: `{"name": "${restaurantName}", "url": "${restaurantUrl}", "rating": "${restaurantRating}"}`
        })

        const removeAction = buildAction({
          name: "remove",
          text: "Remove from List",
          style: "danger",
          value: `{"name": "${restaurantName}", "url": "${restaurantUrl}", "rating": "${restaurantRating}"}`
        })

        const attachment = buildAttachment({
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
        attachments: attachmentArray
      })
    })
}

export async function searchHandler(bot, srcMsg) {
  try {
    const channelInfo = await getChannelFromDB(bot, srcMsg)
    const searchParams = getSearchTerms(srcMsg)

    buildSearchResponse(srcMsg, searchParams, channelInfo)
      .then(messageResponse => {
        return bot.replyAsync(srcMsg, messageResponse)
      })
      .catch(e => {
        return bot.replyAsync(srcMsg, e.message)
      })

  } catch (e) {
    bot.replyAsync(srcMsg, e.message)
  }
}

function finalizeList(bot, srcMsg, channel, voteEvent) {
  return new Promise((resolve, reject) => {
    if (!voteEvent || srcMsg.user != voteEvent.getLunchLeader()) {
      reject(bot.replyAsync(srcMsg, "*You either aren't the lunch leader or there is no vote event going on right now.*"))
    } else if (srcMsg.user == voteEvent.getLunchLeader()) {
      voteEvent.listFinalized()
      botController.storage.channels.save(channel)
      resolve()
    }
  })
}

async function getWinner(bot, srcMsg) {
  try {
    const {channel, voteEvent} = await getChannelFromDB(bot, srcMsg)
    voteEvent.voteClosed()
    botController.storage.channels.save(channel)
    bot.sayAsync({
      text: `*${voteEvent.getWinner()} is the winning restaurant!*`,
      channel: srcMsg.channel
    })
  } catch (e) {
    bot.replyAsync(srcMsg, e.message)
  }
}

export async function finalizeListHandler(bot, srcMsg) {
  try {
    const {channel, voteEvent} = await getChannelFromDB(bot, srcMsg)
    finalizeList(bot, srcMsg, channel, voteEvent)
      .then(() => {
        bot.sayAsync({
          text: "*The list of restaurants have been finalized, you have 10 minutes to vote for your favorite.*",
          channel: srcMsg.channel
        })
      })
      .then(() => timeout(7000))
      .then(() => getWinner(bot, srcMsg))
  } catch (e) {
    bot.replyAsync(srcMsg, e.message)
  }
}

export async function listRestaurantHandler(bot, srcMsg) {
  try {
    const {channel, voteEvent} = await getChannelFromDB(bot, srcMsg)

    if (voteEvent) {
      const attachmentArray = []
      const restaurants = voteEvent.getRestaurants()

      for (const restaurantName in restaurants) {
        const restaurantData = restaurants[restaurantName]
        const { restaurantRating, restaurantUrl} = restaurantData

        const attachment = buildAttachment({
          title: `${restaurantName} (${restaurantRating}/5 Stars)`,
          callback_id: 'castVote',
          title_link: restaurantUrl,
          actions: [{
            "name": restaurantName,
            "text": "Cast Vote",
            "value": restaurantName,
            "type": "button",
          }]
        })

        if (voteEvent.getLunchLeader() === srcMsg.user && !voteEvent.getListFinalized()) {
          attachment["callback_id"] = 'editList'
          attachment["actions"] = [buildAction({
            name: "remove",
            text: "Remove from List",
            style: "danger",
            value: `{"name": "${restaurantName}", "url": "${restaurantUrl}", "rating": "${restaurantRating}"}`
          })]
        }

        if (!voteEvent.getLunchLeader() === srcMsg.user && !voteEvent.getListFinalized()) {
          delete attachment["actions"]
        }

        attachmentArray.push(attachment)
      }
      bot.replyAsync(srcMsg, {
        text: "*List of Restaurants in the Running:*",
        attachments: attachmentArray
      })
    } else {
      bot.replyAsync(srcMsg, "*There isn't an active vote, so theres nothing to list.*")
    }

  } catch (e) {
    bot.replyAsync(srcMsg, e.message)
  }
}
