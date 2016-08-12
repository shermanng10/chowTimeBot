import VoteEvent from './VoteEvent'

export default class Channel {
  constructor(options = {}) {
    this.id = options.id
    this._name = options._name
    this._members = options._members
    this._voteEvent = options._voteEvent
  }

  getMembers() {
    return this._members
  }

  removeMember(member) {
    let members = getMembers()
    let index = members.indexOf(member)
    if (index > -1) {
      members.splice(index, 1); return true
    }
    return false
  }

  addMember(member) {
    this.getMembers().push(member)
  }

  startVoteEvent() {
    if (this._voteEvent && !this._voteEvent.getVoteClosed()){
      throw new Error("*You can't start a new event while another one is still going on.*")
    } else {
      return this._voteEvent = new VoteEvent({
        id: this.id})
    }
  }

  getVoteEvent() {
    if (this._voteEvent) {
      return this._voteEvent = VoteEvent.toObj(this._voteEvent)
    }
  }

  static toObj(data) {
    return new Channel(data)
  }
}