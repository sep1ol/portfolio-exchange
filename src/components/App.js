import { useState, useEffect } from "react";
import { ethers } from "ethers";
import config from "../config.json";
import "../App.css";
import { TOKEN_ABI } from "../abis/Token";

function App() {
  const [acc, setAcc] = useState();

  const loadBlockchainData = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    console.log(accounts);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { chainId } = await provider.getNetwork();
    const token = new ethers.Contract(
      config[chainId].sep1ol.address,
      TOKEN_ABI,
      provider
    );
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  return (
    <div>
      {/* Navbar */}

      <main className="exchange grid">
        <section className="exchange__section--left grid">
          {/* Markets */}

          {/* Balance */}

          {/* Order */}
        </section>
        <section className="exchange__section--right grid">
          {acc}
          {/* PriceChart */}
          {/* Transactions */}
          {/* Trades */}
          {/* OrderBook */}
        </section>
      </main>

      {/* Alert */}
    </div>
  );
}

export default App;
