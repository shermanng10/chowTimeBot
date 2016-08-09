export default class VoteEvent {
	constructor(options = {}){
		this.id = options.id
		this._voters = options._voters || []
		this._restaurants = options.restaurants || {}
		this._votes = options._votes || {}
		this._lunchLeader = options._lunchLeader || null
		this._entryClosed = options._entryClosed || false
		this._voteClosed = options._voteClosed || false
	}

	voteClosed(){
		return this._voteClosed
	}

	entryClose(){
		return this._entryClosed
	}

	getVoters(){
		return this._voters
	}

	removeVoter(voter){
		let voters = this.getVoters()
		let index = voters.indexOf(voter)
		if (index > -1) { voters.splice(index, 1); return true}
		return false
	}

	addVoter(voter){
		this.getVoters().push(voter)
	}

	getRestaurants(){
		return this._restaurants
	}

	removeRestaurant(restaurant){
		delete getRestaurants()[restaurant.name]
	}

	addRestaurant(restaurant){
		getRestaurants()[restaurant.name] = restaurant
	}

	getVotes(){
		return this._votes
	}

	getUserVote(user){
		return this.getVotes()[user]
	}

	addVote(user, restaurant){
		this.getVotes()[user] = restaurant.name
	}

	getLunchLeader(){
		return this._lunchLeader
	}

	setLunchLeader(voter){
		return this._lunchLeader = voter
	}

	randomizeLeader(){
		return this.setLunchLeader(this.getVoters()[Math.floor(Math.random()*this.getVoters().length)])
	}

	static toObj(data){
		return new VoteEvent(data)
	}
}