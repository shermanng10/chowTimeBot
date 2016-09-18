import { mode } from '../utils/FunctionHelpers'

export default class VoteEvent {
  constructor(options = {}) {
    this.id = options.id
    this._voters = options._voters || []
    this._restaurants = options._restaurants || {}
    this._votes = options._votes || {}
    this._lunchLeader = options._lunchLeader || null
    this._entryClosed = options._entryClosed || false
    this._voteClosed = options._voteClosed || false
    this._listFinalized = options._listFinalized || false
  }

  voteClosed() {
    return this._voteClosed = true
  }

  entryClosed() {
    return this._entryClosed = true
  }

  listFinalized() {
    return this._listFinalized = true
  }

  getVoteClosed() {
    return this._voteClosed
  }

  getEntryClosed() {
    return this._entryClosed
  }

  getListFinalized() {
    return this._listFinalized
  }


  getVoters() {
    return this._voters
  }

  removeVoter(voter) {
    let voters = this.getVoters()
    let index = voters.indexOf(voter)
    if (index > -1) {
      voters.splice(index, 1); return true
    }
    return false
  }

  addVoter(voter) {
    this.getVoters().push(voter)
  }

  getRestaurants() {
    return this._restaurants
  }

  removeRestaurant(restaurantName) {
    if (this.getRestaurants()[restaurantName]) {
      delete this.getRestaurants()[restaurantName]
    } else {
      throw new Error("That restaurant is not in the list.")
    }
  }

  addRestaurant(restaurant, restaurantData) {
    if (Object.keys(this.getRestaurants()).length < 5) {
      return this._restaurants[restaurant] = restaurantData
    } else {
      throw new Error("The restaurant list is at max capacity, either remove a restaurant or start the voting process.")
    }
  }

  getVotes() {
    return this._votes
  }

  getUserVote(user) {
    return this.getVotes()[user]
  }

  addVote(user, restaurantName) {
    this.getVotes()[user] = restaurantName
  }

  getLunchLeader() {
    return this._lunchLeader
  }

  setLunchLeader(voter) {
    return this._lunchLeader = voter
  }

  randomizeLeader() {
    return this.setLunchLeader(this.getVoters()[Math.floor(Math.random() * this.getVoters().length)])
  }

  getWinner() {
    let winner = mode(Object.values(this.getVotes()))
    if (winner == null){
      throw new Error('There were no restaurants in the running, start a new vote event and actually choose restaurants from the list.')
    } else {
      return winner
    }
  }

  static toObj(data) {
    return new VoteEvent(data)
  }
}