import { ethers } from 'ethers';
import SwapTokenArtifact from "../../artifacts/contracts/SwapToken.sol/SwapToken.json";
import React, { useState, useEffect } from "react";
import { swapTokenAddress } from '../../contract-address';
import "./style.scss";

const contractAddress = {
  swapToken: swapTokenAddress
}

let provider = new ethers.providers.Web3Provider(window.ethereum);

const RateForm = () => {
  const [address, setAddress] = useState("");
  const [rate, setRate] = useState({
    tokenIn: "",
    tokenOut: "",
    rate: 0,
    decimals: 0
  });

  useEffect(async () => {
    const connectWallet = async () => {
      let userAddress = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAddress(userAddress[0]);
    }

    await connectWallet();
  })

  const tokenSwap = new ethers.Contract(
    contractAddress.swapToken,
    SwapTokenArtifact.abi,
    provider.getSigner(0)
  );

  const handleChange = (e) => {
    let value = e.target.value;

    setRate((prev) => {
      return {
        ...prev,
        [e.target.name]: value
      }
    });
  }

  const handleSubmit = async () => {
    let changeRate = await tokenSwap.changeRate(rate.tokenIn, rate.tokenOut, rate.rate, rate.decimals);
    console.log(changeRate);
  }

  return (
    <section className="rate-form">
      <div className="rate-section">
        <label htmlFor="token-in-rate__address">Token in address</label>
        <input onChange={handleChange} id="token-in-rate__address" name="tokenIn" type="text" className="form-control" placeholder="Token in address..." />
      </div>
      <div className="rate-section">
        <label htmlFor="token-out-rate__address">Token out address</label>
        <input onChange={handleChange} id="token-out-rate__address" name="tokenOut" type="text" className="form-control" placeholder="Token out address..." />
      </div>
      <div className="rate-section">
        <label htmlFor="token-rate__rate">Rate</label>
        <input onChange={handleChange} id="token-rate__rate" name="rate" type="number" className="form-control" placeholder="Rate..." />
      </div>
      <div className="rate-section">
        <label htmlFor="token-rate__decimals">Decimals</label>
        <input onChange={handleChange} type="token-rate__decimals" name="decimals" className="form-control" placeholder="Decimals..." />
      </div>
      <button onClick={handleSubmit} className="btn btn-primary">
          SWAP
      </button>
    </section>
  );
}

export default RateForm;
