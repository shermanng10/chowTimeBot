import botController from './Bot'
import Channel from '../models/Channel'

async function createChannel(bot, srcMsg){
  try {
    var info = await botGetPublicChannelInfo(bot, srcMsg)
    var channel = info.channel
  } catch(e){
    try {
      var info = await botGetPrivateGroupInfo(bot, srcMsg)
      var channel = info.group
    } catch(e){
      console.log(e)
    }
  }
  let cChannel = new Channel({
    id: channel.id,
    _name: channel.name,
    _members: channel.members
  })
  botController.storage.channels.save(cChannel)
  return cChannel
}

function getChannelFromDB(bot, srcMsg) {
  return new Promise((resolve, reject) => {
    botController.storage.channels.get(srcMsg.channel, (err, data) => {
      if (err !== null) {
        reject(err)
      }
      else if (data == null){
        return resolve(createChannel(bot, srcMsg))
      }
      let channel = Channel.toObj(data)
      let voteEvent = channel.getVoteEvent()
      resolve({
        channel: channel,
        voteEvent: voteEvent
      })
    })
  })
}

function botReply(bot, srcMsg, msg) {
  return new Promise((resolve, reject) => {
    bot.reply(srcMsg, msg, (err, response) => {
      if (err !== null) {
        return reject(err)
      }
      resolve(response)
    })
  })
}

function botSay(bot, msg) {
  return new Promise((resolve, reject) => {
    bot.say(msg, (err, response) => {
      if (err !== null) return reject(err)
      resolve(response)
    })
  })
}

function botChatUpdate(bot, msg) {
  return new Promise((resolve, reject) => {
    bot.api.chat.update(msg, (err, response) => {
      if (err !== null) return reject(err)
      resolve(response)
    })
  })
}

function botGetUserInfo(bot, userId) {
  return new Promise((resolve, reject) => {
    bot.api.users.info({
      user: userId
    }, (err, response) => {
      if (err !== null) reject(err)
      resolve(response)
    })
  })
}

function botGetPublicChannelInfo(bot, srcMsg) {
  return new Promise((resolve, reject) => {
    bot.api.channels.info({
      channel: srcMsg.channel
    }, (err, info) => {
      if (err !== null) reject(err)
      resolve(info)
    })
  })
}

function botGetPrivateGroupInfo(bot, srcMsg){
    return new Promise((resolve, reject) => {
    bot.api.groups.info({
      channel: srcMsg.channel
    }, (err, info) => {
      if (err !== null) reject(err)
      resolve(info)
    })
  })
}

export { getChannelFromDB, botReply, botSay, botChatUpdate, botGetUserInfo, botGetPublicChannelInfo }
