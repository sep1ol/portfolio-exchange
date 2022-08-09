import "../App.css";
import config from "../config.json";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadToken,
} from "../store/interactions";

function App() {
  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    const account = await loadAccount(dispatch);

    const provider = loadProvider(dispatch);
    const chainId = await loadNetwork(provider, dispatch);

    const { symbol, token } = await loadToken(
      config[chainId].sep1ol.address,
      provider,
      dispatch
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
