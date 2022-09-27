import "../App.css";
import config from "../config.json";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import Popup from "./Popup";
import Navbar from "./Navbar";
import Markets from "./Markets";
import Balance from "./Balance";
import Order from "./Order";
import OrderBook from "./OrderBook";
import PriceChart from "./PriceChart";
import Trades from "./Trades";
import Transactions from "./Transactions";
import Alert from "./Alert";

import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadExchange,
  loadAllOrders,
  subscribeToEvents,
} from "../store/interactions";

function App() {
  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    // Connect Ethers to blockchain
    const provider = loadProvider(dispatch);

    // Fetch network's chain ID
    const chainId = await loadNetwork(provider, dispatch);

    // Fetch account from Metamask when changed
    window.ethereum.on("accountsChanged", () => {
      loadAccount(provider, dispatch);
      window.location.reload();
    });

    // Reload page when network changes
    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });

    // Fetch tokens' contracts and symbols
    const SEPT = config[chainId].sep1ol.address;
    const mETH = config[chainId].mETH.address;
    await loadTokens([SEPT, mETH], provider, dispatch);

    // Fetch Exchange's contract
    const exchange = await loadExchange(
      config[chainId].exchange.address,
      provider,
      dispatch
    );

    loadAllOrders(provider, exchange, dispatch);

    subscribeToEvents(exchange, dispatch);
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  return (
    <div>
      <Navbar />
      <Popup />

      <main className="exchange grid">
        <section className="exchange__section--left grid">
          <Markets />
          <Balance />
          <Order />
        </section>
        <section className="exchange__section--right grid">
          <PriceChart />
          <Transactions />
          <Trades />
          <OrderBook />
        </section>
      </main>

      <Alert />
    </div>
  );
}

export default App;
