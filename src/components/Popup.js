import closeButton from "../assets/close-black.svg";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loadGiveawayInfo,
  giveTokens,
  loadBalances,
  selectFaucet,
} from "../store/interactions";
import config from "../config.json";

const Popup = () => {
  const dispatch = useDispatch();
  const provider = useSelector((state) => state.provider.connection);
  const freeTokensContract = useSelector((state) => state.giveAway.contract);
  const user = useSelector((state) => state.provider.account);
  const chainId = useSelector((state) => state.provider.chainId);

  const [popupActive, setPopupActive] = useState(true);

  const exchange = useSelector((state) => state.exchange.contract);
  const tokens = useSelector((state) => state.tokens.contracts);
  const account = useSelector((state) => state.provider.account);
  const transactionType = useSelector(
    (state) => state.exchange.transaction.transactionType
  );
  const isSuccessful = useSelector(
    (state) => state.exchange.transaction.isSuccessful
  );

  useEffect(() => {
    if (isSuccessful && transactionType === "Giveaway") {
      loadBalances(exchange, tokens, account, dispatch);
      dispatch({ type: "BALANCE_UPDATED" });
    }

    if (freeTokensContract && user && dispatch) {
      loadGiveawayInfo(freeTokensContract, user, dispatch);
    }

    if (chainId && dispatch) {
      selectFaucet(chainId, dispatch);
    }
  }, [chainId, freeTokensContract, user, dispatch]);

  const giveAwayHandler = (e) => {
    e.preventDefault();

    if (!provider) {
      alert("Error connecting to Metamask.");
    } else if (!user) {
      alert("Please connect with Metamask first.");
    } else if (!freeTokensContract) {
      alert("Error connecting to Smart Contract.");
    } else if (dispatch) {
      giveTokens(provider, freeTokensContract, dispatch);
    }
  };

  return (
    <>
      {typeof window.ethereum !== "undefined" ? (
        popupActive && (
          <div className="popup">
            <img
              onClick={() => {
                setPopupActive((prev) => !prev);
              }}
              src={closeButton}
              alt="Close popup button"
              className="close--popup"
            />
            <h1 className="h1--popup">
              Get free tokens I created to use on the exchange on Goerli/Sepolia
              PoS testnets!
            </h1>
            <button onClick={giveAwayHandler} className="button btn--popup">
              **GET [SEPT/mETH/mUSDT]
            </button>
            {chainId && (
              <a
                href={config[chainId].faucet}
                target="_blank"
                className="button btn--popup"
              >
                **GET [{config[chainId].name}'s ETH] to sign transactions
              </a>
            )}

            <a
              href="https://www.sepiol.dev"
              target="_blank"
              className="button btn--popup"
            >
              Visit my professional website
            </a>
            <a
              href="https://calendly.com/sep1ol/meet-me"
              target="_blank"
              className="button btn--popup"
            >
              Book a 15min call with me today!
            </a>
          </div>
        )
      ) : (
        <div className="popup">
          <h1>
            Metamask not identified on web browser.
            <br />
            Please install Metamask and reload the page.
          </h1>
        </div>
      )}
    </>
  );
};

export default Popup;
