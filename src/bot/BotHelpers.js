import botController from './Bot'
import Channel from '../models/Channel'

export async function createChannel(bot, srcMsg){
  try {
    var { channel } = await botGetPublicChannelInfo(bot, srcMsg)
  } catch(e){
    try {
      var { channel } = await botGetPrivateGroupInfo(bot, srcMsg)
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

export function getChannelFromDB(bot, srcMsg) {
  return new Promise((resolve, reject) => {
    botController.storage.channels.get(srcMsg.channel, (err, data) => {
      if (err !== null) {
        reject(err)
      }
      else if (data == null){
        return resolve(createChannel(bot, srcMsg))
      }
      const channel = Channel.toObj(data)
      const voteEvent = channel.getVoteEvent()
      resolve({
        channel: channel,
        voteEvent: voteEvent
      })
    })
  })
}
