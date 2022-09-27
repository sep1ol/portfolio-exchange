// Displayed information:
// 1) Get free SEPT, mETH and mUSDT
// 1.1) Link to Faucet?
// 2) Visit Sepiol's Website
// 3) Book a 15 minute call with me
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadGiveawayInfo, giveTokens } from "../store/interactions";

const Popup = () => {
  const dispatch = useDispatch();
  const provider = useSelector((state) => state.provider.connection);
  const freeTokensContract = useSelector((state) => state.giveAway.contract);
  const user = useSelector((state) => state.provider.account);

  const giveawayAvailable = useSelector((state) => state.giveAway.available);

  useEffect(() => {
    if (freeTokensContract && user && dispatch) {
      loadGiveawayInfo(freeTokensContract, user, dispatch);
    }
  }, [freeTokensContract, user, dispatch]);

  const giveAwayHandler = () => {
    if (
      giveawayAvailable &&
      user &&
      provider &&
      freeTokensContract &&
      dispatch
    ) {
      giveTokens(provider, freeTokensContract, dispatch);
    } else {
      alert("You may not be connected with Metamask.");
    }
  };

  return (
    <div className="popup">
      <h1 className="h1--popup">
        Get free tokens to use the exchange <br />
        on Goerli/Rinkeby testnets!
      </h1>
      <button onClick={giveAwayHandler} className="button btn--popup">
        ** Get Free SEPT/mETH/mUSDT
      </button>
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
  );
};

export default Popup;
