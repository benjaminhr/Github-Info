import React from 'react';
import axios from 'axios';
import githubUsernameRegex from 'github-username-regex';

import Header from './Header/Header';
import Content from './Content';
import Footer from './Footer';

const id = "f5ce4435afdfe23711c6";
const sec = "1daa19d525b9e92f034ebe504075e5b1600eea46";
const params = "?client_id=" + id + "&client_secret=" + sec;

class GetInfo extends React.Component {
	constructor (props) {
		super(props);
		this.state = { 
			input: 'getify',
			user: null,
			repos: null,
			languages: null,
			maxLanguage: null,
 			isInvalid: false,
			isFound: true,
			searchHistory: []
		}
		this.getInfo = this.getInfo.bind(this);
		this.getLanguages = this.getLanguages.bind(this);
		this.inputHandler = this.inputHandler.bind(this);
	}

	componentDidMount() {
		this.getInfo();
	}

	getInfo() {
		const username = this.state.input;
		// Check if the username is a valid one
		if(!githubUsernameRegex.test(username)) {
			// if not, set state to reflect so
			// and exit the function without calling the API
			this.setState({isInvalid: true})
			return;
		} else { 
			this.setState({isInvalid: false})
		}
		// Get user data
		const userUrl = 'https://api.github.com/users/' + username + params;
		const reposUrl = 'https://api.github.com/users/' + username + '/repos' + params + '&per_page=100';

		axios.all([ 
			axios.get(userUrl), axios.get(reposUrl) 
			])
			.then(axios.spread((userResp, reposResp) => {
				
				this.appendToSearchHistory(userResp.data.login);

					this.setState({
						user: userResp.data,
						repos: reposResp.data,
						isFound:true,
					});

					this.getLanguages();
				}))
				.catch((error) => {
    				console.log('FAIL', error);
    				if(error.response.status === 404){
						this.setState({isFound: false});
					}
  				});
	}

	appendToSearchHistory(newEntry) {
		let searchHistory = [...this.state.searchHistory];
		let index = searchHistory.indexOf(newEntry);

		if(index < 0) {
			searchHistory.push(newEntry);
		} else {
			searchHistory.push(searchHistory.splice(index, 1)[0]);
		}

		this.setState({
			searchHistory: searchHistory.length <= 5 ?  searchHistory : searchHistory.slice(-5),
		});		
	}

	getLanguages () {
		const repos = this.state.repos;
		if (repos) {
			const ownedRepos = repos.filter(repo => repo.fork === false);
			const languagesUrl = ownedRepos.map(repo => repo.languages_url + params);
			axios.all(
				languagesUrl.map(url => axios.get(url))
			)
			.then( res => {
				const langs = res.map(result => result.data
					).filter(value => Object.keys(value).length !== 0);
				this.setState({languages: langs});
			});
		}
	}

	inputHandler(event) {
		const input = event.target.value;
		this.setState({input});
	}

	findMax(obj) {
		if (obj && Object.keys(obj).length > 0) {
			let topLang = Object.keys(obj).reduce((a, b) => obj[a] > obj[b] ? a : b);
			return topLang;
		} 
		return null;
	}

	render() {
		let langSum = {};
		if (this.state.languages) {
			for (let i=0; i<this.state.languages.length; i++) {
				for(let key in this.state.languages[i]){
       				langSum[key] = langSum[key] ? langSum[key] + this.state.languages[i][key] : this.state.languages[i][key];
      			}
    		}
		}
		const topLang = this.findMax(langSum);

		return (
			<div className='wrapper'>
				<Header 
					change={this.inputHandler}
					click={this.getInfo}
					searchHistory={this.state.searchHistory}
				/>
				<Content 
					isInvalid={this.state.isInvalid}
					isFound={this.state.isFound}
					user={this.state.user}
					repos={this.state.repos}
					topLang={topLang} />
				<Footer />
			</div>
		);
	}
}

export default GetInfo;