import { getDefaultProvider, ethers } from "ethers"
import { NftProvider, useNft } from "use-nft"
import { useEffect, useState } from 'react'
import Image from 'next/image'

//create mapping of functions

// We are using the "ethers" fetcher here.
const ethersConfig = {
   provider: getDefaultProvider("homestead"), //change this to rinkeby
}

// Wrap your app with <NftProvider />.
export default function Marketplace() {
   return (
      <NftProvider fetcher={["ethers", ethersConfig]}>
         <Nft1 />
      </NftProvider>
      
   )

   /*
   async function getUserHoldings() {
      // Initialize web3 connection + signer
      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)    
      const signer = provider.getSigner()
      // initialize nft contract address
      const nftContractAddress = "0x0B209802B5C25CD55FF64B7EC0eD7ceb6420e68B";
      userHoldings = await nftContractAddress.balanceOf(signer)
      return userHoldings

   }
   */

   function Nft1() {
      const { loading, error, nft } = useNft(
         "0x5180db8f5c931aae63c74266b211f580155ecac8",
         "5731"
      )

      // nft.loading is true during load.
      if (loading) return <>Loading…</>

      // nft.error is an Error instance in case of error.
      if (error || !nft) return <>Error.</>

      // You can now display the NFT metadata.
      return (
         <section>
            <cryptocoven>
               <h1>{nft.name}</h1>
               <Image src={nft.image} alt="" height={500} width={500} />
               <p>{nft.description}</p>
               <p>Owner: {nft.owner}</p>
               <p>Metadata URL: {nft.metadataUrl}</p>
            </cryptocoven>
            <helpinghand>
               <h1>{nft.name}</h1>
               <Image src={nft.image} alt="" height={500} width={500} />
               <p>{nft.description}</p>
               <p>Owner: {nft.owner}</p>
               <p>Metadata URL: {nft.metadataUrl}</p>
            </helpinghand>
         </section>
      )
   }
}


