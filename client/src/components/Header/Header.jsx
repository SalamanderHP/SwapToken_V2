import React, { useState, useEffect } from "react";
import "./style.scss";

const Header = () => {
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (window.ethereum === undefined) {
      alert("no Wallet detected");
    }

    if (!address) {
      connectWallet();
    }
  }, [address]);

  const connectWallet = async () => {
    let userAddress = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (userAddress) {
      setAddress(userAddress[0]);
    }
  }

  return (
    <>
      <header>
        Swap Token
        <div className="account-info">
          { address }
        </div>
      </header>
    </>
  );
}

export default Header;
