export default class Channel {
	constructor(options = {}){
		this.id = options.id
		this._name = options.name
		this._members = options.members
		this._lunchLeader = null
	}

	getMembers(){
		return this._members
	}

	removeMember(member){
		let members = getMembers()
		let index = members.indexOf(member)
		if (index > -1) { members.splice(index, 1); return true}
		return false
	}

	addMember(member){
		getMembers().push(member)
	}

	getLunchLeader(){
		return this._lunchLeader
	}

	setLunchLeader(member){
		return this._lunchLeader = member
	}

	randomizeLeader(){
		return setLunchLeader(getMembers()[Math.floor(Math.random()*this.members.length)])
	}
}