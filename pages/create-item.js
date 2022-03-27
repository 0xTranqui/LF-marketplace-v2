//=========STANDARD IMPORTS
import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import Image from 'next/image'

import {
  nftaddress, nftmarketaddress
} from '../config'

import NFT from '../utils/NFT.json'

import Market from '../utils/NFTMarket.json'

//=========EXTRA ZORA IMPORTS
import mainnetZoraAddresses from "@zoralabs/v3/dist/addresses/4.json"; // Rinkeby addresses, 1.json would be Rinkeby Testnet 
import { IERC721__factory } from "@zoralabs/v3/dist/typechain/factories/IERC721__factory";
import { IERC20__factory } from "@zoralabs/v3/dist/typechain/factories/IERC20__factory";
import { ZoraModuleManager__factory } from "@zoralabs/v3/dist/typechain/factories/ZoraModuleManager__factory";
import { AsksV11__factory } from "@zoralabs/v3/dist/typechain/factories/AsksV11__factory";

import {
  zoramarketaddress
} from '../config'

import AsksV1_1 from '../node_modules/@zoralabs/v3/dist/artifacts/modules/Asks/V1.1/AsksV1_1.sol/AsksV1_1.json'

//=======EXTRA ERC721 INPUTS

import {
  mynftaddress
} from '../config'
import Subversivs from '../utils/custom-erc721-v1.json'

import { 
  LostandFound_vol_1_address
} from '../config'
import LostandFound_vol_1 from '../utils/LostandFound_vol_1.json'

import {
  lostandfound_vol_1_v2_address
} from '../config'
import lostandfound_vol_1 from '../utils/lostandfound_vol_1_v2.json'

// ======== OG IPFS PARAMETER =======
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

export default function CreateItem() {
  //===OG App State Setting
  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
  const router = useRouter()

  //===ZORA App State Setting
  const [zoraFormInput, zoraUpdateFormInput] = useState({ _tokenId: '', _askPrice: '', _sellerFundsRecipient: '', _findersFeeBps: '' })

  //===ERC721 State Setting
  const [erc721FormInput, erc721UpdateFormInput] = useState({ _numberOfTokens: '' })

  //======= OG App Functionality ========

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
  async function createMarket() {
    const { name, description, price } = formInput
    if (!name || !description || !price || !fileUrl) return
    // first, upload to IPFS 
    const data = JSON.stringify({
      name, description, image: fileUrl
    })
    try {
      const added = await client.add(data)
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      // after file is uploaded to IPFS, pass the URL to save it on Polygon
      createSale(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
  }

  async function createSale(url) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)    
    const signer = provider.getSigner()
    // next, create the item 
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
    let transaction = await contract.createToken(url)
    let tx = await transaction.wait()
    let event = tx.events[0]
    let value = event.args[2]
    let tokenId = value.toNumber()
    const price = ethers.utils.parseUnits(formInput.price, 'ether')
    /* then list the item for sale on the marketplace */
    contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()
    transaction = await contract.createMarketItem(nftaddress, tokenId, price, { value: listingPrice })
    await transaction.wait()
    router.push('/')
  }

// ****************** ZORA FUNCTIONALITY ****************** 

// ERC721TransferHelper and ZoraModuleManagerApproval Section

  async function erc721TransferHelperApproval() {
    // Initialize web3 connection + signer
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)    
    const signer = provider.getSigner()
    const moduleManagerAddress = mainnetZoraAddresses.ZoraModuleManager; //this is actually rinkeby address
    const ownerAddress = "0x153D2A196dc8f1F6b9Aa87241864B3e4d4FEc170"; // Owner of the assets
    // ^this should be changed to signer.address(this) I think?


    // Initialize LostandFound Vol. 1 NFT contract
    const nftContractAddress = "0x0B209802B5C25CD55FF64B7EC0eD7ceb6420e68B";
    const erc721Contract = IERC721__factory.connect(nftContractAddress, signer);

    // Initialize Zora V3 Module Manager contract 
    const moduleManagerContract = ZoraModuleManager__factory.connect(mainnetZoraAddresses.ZoraModuleManager, signer);


    
    // ======ERC721TransferHelper approval flow=======
    const erc721TransferHelperAddress = mainnetZoraAddresses.ERC721TransferHelper;
    const erc721TransferHelperApproved = await erc721Contract.isApprovedForAll(
      ownerAddress, // NFT owner address
      erc721TransferHelperAddress // V3 Module Transfer Helper to approve
    );

    // If the approval is not already granted, add it.
    if (erc721TransferHelperApproved === false) {
    // Notice: Since this interaction submits a transaction to the blockchain it requires an ethers signer.
    // A signer interfaces with a wallet. You can use walletconnect or injected web3.
      await erc721Contract.setApprovalForAll(erc721TransferHelperAddress, true);
      // ^MIGHT NEED TO ADD A SIGNER IN HERE
    }

  }

  
  //=======ZoraModuleManager approval flow==========
  /// checks to see if Asks v1.1 is approved, if not, asks user to approve
  async function zoraAsksV1_1Approval() {
    // Initialize web3 connection + signer
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)    
    const signer = provider.getSigner()
    const moduleManagerAddress = mainnetZoraAddresses.ZoraModuleManager; //this is actually rinkeby address
    const ownerAddress = "0x153D2A196dc8f1F6b9Aa87241864B3e4d4FEc170"; // Owner of the assets
    // ^this should be changed to signer.address(this) I think?

    // Initialize Zora V3 Module Manager contract 
    const moduleManagerContract = ZoraModuleManager__factory.connect(mainnetZoraAddresses.ZoraModuleManager, signer);

    // Check to see if Asks V1.1 already approved
    const zoraModuleManagerApproved = await moduleManagerContract.isModuleApproved(ownerAddress, mainnetZoraAddresses.AsksV1_1);
    
    //if not initiate a signer and approve the module
    if (zoraModuleManagerApproved === false) {
      await moduleManagerContract.setApprovalForModule(mainnetZoraAddresses.AsksV1_1, true);
    }
  }

  //=======ZORA createAsk flow========
  async function zoraCreateAsk() {
    // initiate signer
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)    
    const signer = provider.getSigner()
    
    //  initialize AsksV1.1 Module Contract
    const askModuleContract = AsksV11__factory.connect(mainnetZoraAddresses.AsksV1_1, signer);

    // set parameters for createAsk function
    const lostandfound_nft_contractaddress = lostandfound_vol_1_v2_address;
    const askPrice = ethers.utils.parseUnits(zoraFormInput._askPrice, 'ether') // Input should be in ETH here   
    const tokenId = zoraFormInput._tokenId;
    const sellerRecipientAddress = zoraFormInput._sellerFundsRecipient; // Owner of the assets
    // ^this should be changed to signer.address(this) I think?
    const findersFeeBps = zoraFormInput._findersFeeBps; // 2% Finders Fee (in BPS)

    // call createAsk function and feed in user inputs
    await askModuleContract.createAsk(
      lostandfound_nft_contractaddress,
      tokenId,
      askPrice,
      "0x0000000000000000000000000000000000000000", // 0 address for ETH sale
      sellerRecipientAddress,
      findersFeeBps
    )
  }

  //=======ZORA fillAsk flow========
  async function zoraFillAsk() {
    // initiate signer
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)    
    const signer = provider.getSigner()
    
    //  initialize AsksV1.1 Module Contract
    const askModuleContract = AsksV11__factory.connect(mainnetZoraAddresses.AsksV1_1, signer);

    // set parameters for fillAsk function
    const lostandfound_nft_contractaddress = lostandfound_vol_1_v2_address; //
    const fillTokenId = zoraFormInput._fillTokenId;    
    const fillPrice = ethers.utils.parseUnits(zoraFormInput._fillPrice, 'ether') // Input should be in ETH here   
    const finderAddress = zoraFormInput._finderAddress; // Owner of the assets
    const msgValue = (zoraFormInput._fillPrice * (10 ** 18)).toString(); //converts fillprice eth to string of wei used to pass msg.value
    let overrides = { value: msgValue };

    // call fillAsk function and feed in user inputs
    await askModuleContract.fillAsk(
      lostandfound_nft_contractaddress,
      fillTokenId,
      "0x0000000000000000000000000000000000000000", // 0 address for ETH sale
      fillPrice,
      finderAddress,
      overrides
    )
  }

  //=======ZORA setAskPrice flow========
  async function zoraSetAskPrice() {
    // initiate signer
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)    
    const signer = provider.getSigner()
    
    //  initialize AsksV1.1 Module Contract
    const askModuleContract = AsksV11__factory.connect(mainnetZoraAddresses.AsksV1_1, signer);

    // set parameters for setAskPrice function
    const lostandfound_nft_contractaddress = lostandfound_vol_1_v2_address;
    const setAskPrice = ethers.utils.parseUnits(zoraFormInput._setAskPrice, 'ether') // Input should be in ETH here   
    const setTokenId = zoraFormInput._setTokenId;

    // call setAskPrice function and feed in user inputs
    await askModuleContract.setAskPrice(
      lostandfound_nft_contractaddress,
      setTokenId,
      setAskPrice,
      "0x0000000000000000000000000000000000000000" // 0 address for ETH sale
    )
  }

  //=======ZORA cancelAsk flow========
  async function zoraCancelAsk() {
    // initiate signer
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)    
    const signer = provider.getSigner()
    
    //  initialize AsksV1.1 Module Contract
    const askModuleContract = AsksV11__factory.connect(mainnetZoraAddresses.AsksV1_1, signer);

    // set parameters for cancelAsk function
    const lostandfound_nft_contractaddress = lostandfound_vol_1_v2_address; 
    const cancelTokenId = zoraFormInput._cancelTokenId;

    // call cancelAsk function and feed in user inputs
    await askModuleContract.cancelAsk(
      lostandfound_vol_1_v2_address,
      cancelTokenId
    )
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
    const numberOfTokens = (erc721FormInput._numberOfTokens);
    const mintMsgValue = (numberOfTokens * 0.01 * (10 ** 18)).toString(); //converts fillprice eth to string of wei used to pass msg.value
    let overrides = { value: mintMsgValue };

    // call lostandfoundMint function and feed in user inputs
    await lostandfound_nft_contractaddress.mint(
      numberOfTokens,
      overrides
    )
  }
/*

    let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
    let transaction = await contract.createToken(url)
    let tx = await transaction.wait()
    let event = tx.events[0]
    let value = event.args[2]
    let tokenId = value.toNumber()
    const price = ethers.utils.parseUnits(formInput.price, 'ether')
    
    //then list the item for sale on the marketplace
    
    contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()
    transaction = await contract.createMarketItem(nftaddress, tokenId, price, { value: listingPrice })
    await transaction.wait()
    router.push('/')


*/


  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12 gap-1">
        <h1 className="underline font-bold text-3xl mt-2 text-black rounded p-2 text-center">
          MINT FLOW
        </h1>
        <input 
          placeholder="How many NFTs do you want to mint? (max 2 per wallet)"
          className="placeholder:text-pink-700 mt-1 border rounded p-1"
          onChange={e => erc721UpdateFormInput({ ...erc721FormInput, _numberOfTokens: e.target.value })}
        />  
        <button onClick={lostandfoundMint} className="font-bold mt-2 bg-pink-600 text-white rounded p-2 shadow-lg">
          MINT Lost & Found Vol. 1
        </button>
        <h1 className="underline font-bold text-3xl mt-2 text-black rounded p-2 text-center">
          ZORA CONTRACT FLOW
        </h1>
        <button onClick={erc721TransferHelperApproval} className="font-bold mt-2 bg-slate-700 text-white rounded p-2 shadow-lg">
          APPROVE ERC721TransferHelper
        </button>
        <button onClick={zoraAsksV1_1Approval} className="font-bold mt-2 bg-slate-700 text-white rounded p-2 shadow-lg">
          APPROVE Asks V1.1 Module
        </button>        
        <input 
          placeholder="ZORA: Token ID # of NFT to List"
          className="placeholder:text-purple-900 mt-1 border rounded p-1"
          onChange={e => zoraUpdateFormInput({ ...zoraFormInput, _tokenId: e.target.value })}
        />
        <input
          placeholder="ZORA: List Price (in ETH)"
          className="placeholder:text-purple-900 mt-1 border rounded p-1"
          onChange={e => zoraUpdateFormInput({ ...zoraFormInput, _askPrice: e.target.value })}
        />
        <input
          placeholder="ZORA: Wallet Address to receive funds from sale (full address not ENS name)"
          className="placeholder:text-purple-900 mt-1 border rounded p-1"
          onChange={e => zoraUpdateFormInput({ ...zoraFormInput, _sellerFundsRecipient: e.target.value })}
        />
        <input
          placeholder="ZORA: Finder's Fee %"
          className="placeholder:text-purple-900 mt-1 border rounded p-1"
          onChange={e => zoraUpdateFormInput({ ...zoraFormInput, _findersFeeBps: (e.target.value * 100) })}
        />
        <button onClick={zoraCreateAsk} className="font-bold mt-2 bg-purple-900 text-white rounded p-2 shadow-lg">
          ZORA V3 CREATE ASK
        </button>
        <input 
          placeholder="ZORA: Token ID # of NFT to Buy"
          className="placeholder:text-green-700 mt-1 border rounded p-1"
          onChange={e => zoraUpdateFormInput({ ...zoraFormInput, _fillTokenId: e.target.value })}
        />
        <input
          placeholder="ZORA: Fill Price (in ETH)"
          className="placeholder:text-green-700 mt-1 border rounded p-1"
          onChange={e => zoraUpdateFormInput({ ...zoraFormInput, _fillPrice: e.target.value })}
        />
        <input
          placeholder="ZORA: *OPTIONAL* Finder's Fee Recpient Wallet Address (full address not ENS name)"
          className="placeholder:text-green-700 mt-1 border rounded p-1"
          onChange={e => zoraUpdateFormInput({ ...zoraFormInput, _finderAddress: e.target.value })}
        />
        <button onClick={zoraFillAsk} className="font-bold mt-2 bg-green-700 text-white rounded p-2 shadow-lg">
          ZORA V3 Fill ASK
        </button>
        <input
          placeholder="ZORA: Token ID You Are Updating Ask For"
          className="placeholder:text-blue-800 mt-1 border rounded p-1"
          onChange={e => zoraUpdateFormInput({ ...zoraFormInput, _setTokenId: e.target.value })}
        />
        <input
          placeholder="ZORA: Updated Fill Price (in ETH)"
          className="placeholder:text-blue-800 mt-1 border rounded p-1"
          onChange={e => zoraUpdateFormInput({ ...zoraFormInput, _setAskPrice: e.target.value })}
        />  
        <button onClick={zoraSetAskPrice} className="font-bold mt-2 bg-blue-800 text-white rounded p-2 shadow-lg">
          ZORA V3 UPDATE ASK
        </button>
        <input
          placeholder="ZORA: Token ID To Cancel Listing For"
          className="placeholder:text-red-600 mt-1 border rounded p-1"
          onChange={e => zoraUpdateFormInput({ ...zoraFormInput, _cancelTokenId: e.target.value })}
        />
        <button onClick={zoraCancelAsk} className="font-bold mt-2 bg-red-600 text-white rounded p-2 shadow-lg">
          ZORA V3 CANCEL ASK
        </button>
        <h1 className="underline font-bold text-3xl mt-4 text-black rounded p-4 text-center">
        OG App Contract Flow
        </h1>
        <input 
          placeholder="OG: Asset Name"
          className="mt-8 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />
        <textarea
          placeholder="OG: Asset Description"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />
        <input
          placeholder="OG: Asset Price in ETH"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
        />
        <input
          type="file"
          name="Asset"
          className="my-4"
          onChange={onChange}
        />
        {
          fileUrl && (
            <Image className="rounded mt-4"src={fileUrl} height={300} width={225} />
          )
        }
        <button onClick={createMarket} className="font-bold mt-4 bg-yellow-500 text-white rounded p-4 shadow-lg">
          Original Mint + List Digital Asset
        </button>        
      </div>
    </div>
  )
}