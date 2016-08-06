import YelpClient from 'yelp'
import dotenv from 'dotenv'
dotenv.config()

export default class Yelp {
	constructor(){
		this.client = new YelpClient({
										consumer_key: process.env.YELP_CONSUMER_KEY,
										consumer_secret: process.env.YELP_CONSUMER_SECRET,
										token: process.env.YELP_TOKEN,
										token_secret: process.env.YELP_TOKEN_SECRET
									})	
	}

	getRestaurants({term: term, location:location}){
		return this.client.search({term: term, location: location, limit: 5, sort: 2 })
						   .then((data) => {return data['businesses']})
	}

}

