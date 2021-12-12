import React, { Component} from 'react';
import MyTube_JSON from './MyTube_JSON.json';

import Navbar from './Navbar'
import Main from './Main'
import Footer from './Footer'
import Web3 from 'web3';
import './App.css';

const IPFS = require('ipfs-api');
const ipfs = new IPFS({host: 'ipfs.infura.io',port:5001, protocol:'https'});

//Declare IPFS
//import { create } from 'ipfs-http-client'
// connect using a URL
//const ipfs = create(new URL('http://127.0.0.1:8080'))
//const ipfs = create('/ip4/127.0.0.1/tcp/5001')

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()  
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    // Network ID
    const networkId = await web3.eth.net.getId()
  
    if(networkId) {
      const mytube = new web3.eth.Contract(MyTube_JSON.abi, MyTube_JSON.address[networkId])
      this.setState({ mytube })
      const videosCount = await mytube.methods.videoCount().call()
      this.setState({ videosCount })
      // Load videos, sort by newest
      for (var i=videosCount; i>=1; i--) {
        const video = await mytube.methods.videos(i).call()
        this.setState({
          videos: [...this.state.videos, video]
        })
      }
      //Set latest video with title to view as default 
      const latest = await mytube.methods.videos(videosCount).call()
      this.setState({
        currentHash: latest.hash,
        currentTitle: latest.title
      })
      this.setState({ loading: false})
    } else {
      window.alert('MyTube contract not deployed to detected network.')
    }
  }

  captureFile = event => {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }


  uploadVideo = title => {  
    console.log("Submitting file to IPFS...")
    //adding file to the IPFS
    ipfs.files.add(this.state.buffer, (error, result) => {
      console.log('IPFS result', result)
      if(error) {
        console.error(error)
        return
      }

      this.setState({ loading: true })
      this.state.mytube.methods.uploadVideo(result[0].hash, title).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      console.log('ipfsHash',this.state.ipfsHash)  
      })
    })
  }

  getVideoDetails =async(event) =>{
    event.preventDefault();
    let idNumber = event.target.details.value;
    //console.log(window.func=this.state.mytube.methods)
    let val = await this.state.mytube.methods.getVideoDetails(idNumber);
    console.log(val);
  }

  changeVideo = (hash, title) => {
    this.setState({'currentHash': hash});
    this.setState({'currentTitle': title});
  }

  constructor(props) {
    super(props)
    this.state = {
      buffer: null,
      account: '',
      mytube: null,
      videos: [],
      loading: true,
      currentHash: null,
      currentTitle: null
    }

    this.uploadVideo = this.uploadVideo.bind(this)
    this.captureFile = this.captureFile.bind(this)
    this.changeVideo = this.changeVideo.bind(this)
  }

  render() {
    return (
      <>  
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              videos={this.state.videos}
              uploadVideo={this.uploadVideo}
              captureFile={this.captureFile}
              changeVideo={this.changeVideo}
              currentHash={this.state.currentHash}
              currentTitle={this.state.currentTitle}
              getVideoDetails={this.getVideoDetails}
            />
        }
        <Footer />
      </div>
      </>
    );
  }
}

export default App;