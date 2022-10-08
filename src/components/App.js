import "../App.css";
import config from "../config.json";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ACCEPTED_NETWORKS } from "../store/interactions";

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
  loadFreeTokensContract,
  changeNetwork,
} from "../store/interactions";

function App() {
  const dispatch = useDispatch();

  const chainId = useSelector((state) => state.provider.chainId);
  const provider = useSelector((state) => state.provider.connection);
  const correctNetwork = useSelector((state) => state.provider.correctNetwork);

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
  };

  const loadExchangeData = async () => {
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

    const giveaway = await loadFreeTokensContract(
      config[chainId].giveawayContract,
      provider,
      dispatch
    );

    loadAllOrders(provider, exchange, dispatch);

    subscribeToEvents(exchange, giveaway, dispatch);
  };

  useEffect(() => {
    loadBlockchainData();
    console.log(correctNetwork, chainId);
    if (correctNetwork !== null && correctNetwork) {
      loadExchangeData();
    } else if (chainId !== null) {
      changeNetwork("0x" + ACCEPTED_NETWORKS[0]);
    }
  }, [correctNetwork, chainId]);

  return (
    <>
      {correctNetwork ? (
        <>
          <Popup />
          <div>
            <Navbar />

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
        </>
      ) : (
        <div>
          <h1
            style={{
              color: "red",
            }}
          >
            The exchange is supported on Goerli and Sepolia Testnets, please
            accept the request on Metamask to switch Network.
          </h1>
        </div>
      )}
    </>
  );
}

export default App;
