//=========STANDARD IMPORTS
import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import Image from 'next/image'

import {
   lostandfound_vol_1_v2_address
 } from '../config'

 import lostandfound_vol_1 from '../utils/lostandfound_vol_1_v2.json'

 const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')


 export default function Mint() {

   const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
   const router = useRouter()

   async function onChange(e) {
      const file = e.target.files[0]
      try {
         const added = await client.add(
            file,
            {
               progress: (prog) => console.log(`received: ${prog}`)
            }
         )
         const url = `https://ipfs.infura.io/ipfs/${added.path}`
         setFileUrl(url)
      } catch (error) {
      console.log('Error uploading file: ', error)
      }  
   }

     // ****************** ERC721 MINTING FUNCTIONALITY ****************** 
   async function lostandfoundMint() {
      // initiate signer
      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)    
      const signer = provider.getSigner()

      // initialize LostandFound_vol_1 NFT Contract
      let lostandfound_nft_contractaddress = new ethers.Contract(lostandfound_vol_1_v2_address, lostandfound_vol_1.abi, signer)
      
      // set paramaters for mint function
      const numberOfTokens = (formInput._numberOfTokens);
      const mintMsgValue = (numberOfTokens * 0.01 * (10 ** 18)).toString(); //converts fillprice eth to string of wei used to pass msg.value
      let overrides = { value: mintMsgValue };

      // call lostandfoundMint function and feed in user inputs
      await lostandfound_nft_contractaddress.mint(
      numberOfTokens,
      overrides
      )
   }

   return (
      <div className="flex justify-center">
         <div className="w-1/2 flex flex-col pb-12 gap-1">
            <h1 className="underline font-bold text-3xl mt-2 text-black rounded p-2 text-center">
            MINT FLOW
            </h1>
            <input 
               placeholder="How many NFTs do you want to mint? (max 2 per wallet)"
               className="placeholder:text-pink-700 mt-1 border rounded p-1"
               onChange={e => updateFormInput({ ...formInput, _numberOfTokens: e.target.value })}
            />  
            <button onClick={lostandfoundMint} className="font-bold mt-2 bg-pink-600 text-white rounded p-2 shadow-lg">
               MINT Lost & Found Vol. 1
            </button>       
         </div>
      </div>
   )   
}