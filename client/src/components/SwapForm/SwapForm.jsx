import React, { useState, useEffect } from "react";
import { ethers } from 'ethers';
import TokenArtifact from "../../artifacts/contracts/Token.sol/Token.json";
import SwapTokenArtifact from "../../artifacts/contracts/SwapToken.sol/SwapToken.json";
import "./style.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleArrowRight } from '@fortawesome/free-solid-svg-icons';

const contractAddress = {
  nativeToken: "0x0000000000000000000000000000000000000000",
  tokenA: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  tokenB: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
  swapToken: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"
}

let provider = new ethers.providers.Web3Provider(window.ethereum);

const SwapForm = () => {
  const [address, setAddress] = useState("");
  const [tokenIn, setTokenIn] = useState({
    address: "",
    name: "",
    symbol: "",
    balance: 0,
    decimals: 0
  });
  const [tokenOut, setTokenOut] = useState({
    address: "",
    name: "",
    symbol: "",
    balance: 0,
    decimals: 0
  });
  const [rate, setRate] = useState({
    rate: 0,
    decimals: 0
  });
  const [tokenAmount, setTokenAmount] = useState(0);
  const [tokenOutAmount, setTokenOutAmount] = useState(0);

  const tokenSwap = new ethers.Contract(
    contractAddress.swapToken,
    SwapTokenArtifact.abi,
    provider.getSigner(0)
  );

  useEffect(async () => {
    const connectWallet = async () => {
      let userAddress = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log(`User address: ${userAddress[0]}`);

      setAddress(userAddress[0]);
    }

    const tokenInit = async () => {
      let userBalance = (await provider.getBalance(address)).toString() / 1e18;

      setTokenIn({
        address: contractAddress.nativeToken,
        name: "Ethereum",
        symbol: "ETH",
        balance: userBalance,
        decimals: 18
      });

      let token = new ethers.Contract(
        contractAddress.tokenA,
        TokenArtifact.abi,
        provider.getSigner(0)
      );

      let tokenAmount = await token.balanceOf(address);
      let tokenDecimals = await token.decimals();
      let tokenName = await token.name();
      let tokenSymbol = await token.symbol();

      setTokenOut({
        address: contractAddress.tokenA,
        name: tokenName,
        symbol: tokenSymbol,
        balance: tokenAmount / `1e${tokenDecimals}`,
        decimals: tokenDecimals
      });
    }

    if (window.ethereum === undefined) {
      alert("no Wallet detected");
    }

    await connectWallet();
    if (address) {
      await tokenInit();
      await setTokenRate(contractAddress.nativeToken, contractAddress.tokenA);
    }

    window.ethereum.on("accountsChanged", async ([newAddress]) => {
      await connectWallet();
      await tokenInit();
      await setTokenRate(contractAddress.nativeToken, contractAddress.tokenA);
    });
  }, [address]);

  const handleOptionInChange = async (e) => {
    let optionAddress = e.target.value;
    if (!optionAddress) {
      alert("Contract address is missing");
      return;
    }

    if (optionAddress === contractAddress.nativeToken) {
      let nativeBalance = (await provider.getBalance(address)).toString() / 1e18;
      setTokenIn({
        address: optionAddress,
        name: "Ethereum",
        symbol: "ETH",
        balance: nativeBalance,
        decimals: 18
      });
      return;
    }

    if (optionAddress !== contractAddress.nativeToken) {
      let token = new ethers.Contract(
        optionAddress,
        TokenArtifact.abi,
        provider.getSigner(0)
      );

      let tokenAmount = await token.balanceOf(address);
      let tokenDecimals = await token.decimals();
      let tokenName = await token.name();
      let tokenSymbol = await token.symbol();

      setTokenIn({
        address: optionAddress,
        name: tokenName,
        symbol: tokenSymbol,
        balance: tokenAmount / `1e${tokenDecimals}`,
        decimals: tokenDecimals
      });
    }

    setTokenRate(optionAddress, tokenOut.address);
  }

  const handleOptionOutChange = async (e) => {
    let optionAddress = e.target.value;
    if (!optionAddress) {
      alert("Contract address is missing");
      return;
    }

    if (optionAddress === contractAddress.nativeToken) {
      let nativeBalance = (await provider.getBalance(address)).toString() / 1e18;
      setTokenOut({
        address: optionAddress,
        name: "Ethereum",
        symbol: "ETH",
        balance: nativeBalance,
        decimals: 18
      });
      return;
    }

    if (optionAddress !== contractAddress.nativeToken) {
      let token = new ethers.Contract(
        optionAddress,
        TokenArtifact.abi,
        provider.getSigner(0)
      );

      let tokenAmount = await token.balanceOf(address);
      let tokenDecimals = await token.decimals();
      let tokenName = await token.name();
      let tokenSymbol = await token.symbol();

      setTokenOut({
        address: optionAddress,
        name: tokenName,
        symbol: tokenSymbol,
        balance: tokenAmount / `1e${tokenDecimals}`,
        decimals: tokenDecimals
      });
    }

    setTokenRate(tokenIn.address, optionAddress);
  }

  const handleInputChange = (e) => {
    let value = e.target.value;
    let tokenAmount = value * (10 ** tokenIn.decimals);
    setTokenAmount(tokenAmount);

    let outAmount = value * rate.rate * 10 ** (0 - rate.decimals);
    setTokenOutAmount(outAmount);
  }

  const setTokenRate = async (tokenIn, tokenOut) => {
    let tokenRate = await tokenSwap.tokenRate(tokenIn, tokenOut);
    setRate({
      rate: tokenRate["rate"],
      decimals: tokenRate["decimals"]
    });
  }

  const handleSubmit = async () => {
    console.log(`Token in: ${JSON.stringify(tokenIn)}`);
    console.log(`Token out: ${JSON.stringify(tokenOut)}`);
    console.log(tokenAmount);

    let swapToken = await tokenSwap.swap(tokenIn.address, tokenOut.address, tokenAmount.toString());
    console.log(swapToken);
    if (swapToken) {
      alert("Swap token success");
    }
  }

  return (
    <>
      <div className="swapform__wrapper">
        <div className="row form__container">
          <div className="col-5">
            <div className="token-container">
              <div className="token-select">
                <div className="upper">{tokenIn.symbol}</div>
                <div className="below">
                  <select defaultValue={contractAddress.nativeToken} onChange={handleOptionInChange} className="form-control" name="token-in" id="">
                    <option value={contractAddress.nativeToken}>Ethereum</option>
                    <option value={contractAddress.tokenA}>Token A</option>
                    <option value={contractAddress.tokenB}>Token B</option>
                  </select>
                </div>
              </div>
              <div className="token-value">
                <div className="upper">You send</div>
                <div className="below">
                  <input onChange={handleInputChange} type="number" className="form-control" placeholder="0.00" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-2 arrow-icon">
            <FontAwesomeIcon icon={faCircleArrowRight}/>
          </div>
          <div className="col-5">
            <div className="token-container">
              <div className="token-select">
                <div className="upper">{tokenOut.symbol}</div>
                <div className="below">
                  <select defaultValue={contractAddress.tokenA} onChange={handleOptionOutChange} className="form-control" name="token-out" id="">
                    <option value={contractAddress.nativeToken}>Ethereum</option>
                    <option value={contractAddress.tokenA}>Token A</option>
                    <option value={contractAddress.tokenB}>Token B</option>
                  </select>
                </div>
              </div>
              <div className="token-value">
                <div className="upper">You receive</div>
                <div className="below">
                  <input type="text" id="token-out-amount" value={tokenOutAmount} className="form-control" placeholder="0.00" disabled />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="fund">
          {`Available funds = ${tokenIn.balance} ${tokenIn.symbol}`}
        </div>
        <div className="rate">
          {`1 ${tokenIn.symbol} = ${(rate.rate * 10 ** (-rate.decimals))} ${tokenOut.symbol}`}
        </div>
        <button onClick={handleSubmit} className="btn-primary swap-button">
          SWAP
        </button>
      </div>
    </>
  );
}

export default SwapForm;
