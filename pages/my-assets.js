/* pages/my-assets.js */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import Image from 'next/image'


import {
  nftmarketaddress, nftaddress
} from '../config'
import NFT from '../utils/NFT.json'
import Market from '../utils/NFTMarket.json'


//=====ZORA IMPORTS
import {
  zoramarketadress, lostandfound_vol_1_v2_address
} from '../config'
import lostandfound_vol_1 from '../utils/lostandfound_vol_1_v2.json'
import AsksV1_1 from '../node_modules/@zoralabs/v3/dist/artifacts/modules/Asks/V1.1/AsksV1_1.sol/AsksV1_1.json'

//====USE-NFT imports
import { getDefaultProvider, } from "ethers"
import { NftProvider, useNft } from "use-nft"

//====USE-NFT constants
const ethersConfig = {
  provider: getDefaultProvider("homestead")
}

export default function MyAssets() {
  
  /*
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadNFTs()
  }, [])
  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      //-might need to change back to mainnet
      network: "rinkeby",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
      
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const data = await marketContract.fetchMyNFTs()
    
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded') 
  }
  */
  

  
  //full rebuild of Nader's work
  const [zoraNFTs, zoraSetNFTs] = useState([])
  const [zoraLoadingState, zoraSetLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadZoraNFTs()
  }, [])
  async function loadZoraNFTs() {
    // took out cache provider for web3modal, can add back in if necssar
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    //info for askForNFT query
    const tokenIdQuery = 20;
      
    const zoraAsksModuleContract = new ethers.Contract(zoramarketadress, AsksV1_1.abi, signer)
    const lostandfoundContract = new ethers.Contract(lostandfound_vol_1_v2_address, lostandfound_vol_1.abi, provider)
    const zoraData = await zoraAsksModuleContract.askForNFT("0x0B209802B5C25CD55FF64B7EC0eD7ceb6420e68B", '5')
    
    const zoraItems = await Promise.all(zoraData.map(async i => {
      const zoraTokenURI = await lostandfoundContract.tokenURI(5)
      const zoraMeta = await axios.get(zoraTokenURI)
      //let zoraPrice = ethers.utils.formatUnits(i.askPrice, 'ether ')
      let zoraItem = {
        //zoraPrice,
        zoraTokenId: i.tokenId,
        zoraSeller: i.seller,
        zoraSelerFundsRecipient: i.sellerFundsRecipient,
        //I think I can take owner out
        //zoraOwner: i.owner,
        //zoraImage: meta.data.image,
      }
      return zoraItem
    }))
    zoraSetNFTs(zoraItems)
    zoraSetLoadingState('loaded') 
  }
  

  


  // ==== ZORA FUNCITONALITY
  /*
  function MyNFT() {
    const data = useNFT("0x0B209802B5C25CD55FF64B7EC0eD7ceb6420e68B", "1")
    const metadata = useNFTMetadata(deta && data.metadataURI)
  }
  */

  
  if (zoraLoadingState === 'loaded' && !zoraNFTs.length) return (<h1 className="py-10 px-20 text-3xl">No assets owned</h1>)
  return (
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            zoraNFTs.map((zoranft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <Image src="https://via.placeholder.com/150" className="rounded" height={300} width={225} />
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">Price - {zoranft.price} ETH</p>
                  <p className="text-2xl font-bold text-white">{zoranft.tokenId}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
  
  

  /*
  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No assets owned</h1>)
  return (
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <Image src={nft.image} className="rounded" height={300} width={225} />
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">Price - {nft.price} ETH</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
  */
  
}