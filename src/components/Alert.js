import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import config from "../config.json";
import closeButton from "../assets/close.svg";

import { myEventsSelector } from "../store/selectors";

const Alert = () => {
  const alertRef = useRef(null);

  const account = useSelector((state) => state.provider.account);
  const network = useSelector((state) => state.provider.network);
  const events = useSelector(myEventsSelector);

  const isPending = useSelector(
    (state) => state.exchange.transaction.isPending
  );
  const isSuccessful = useSelector(
    (state) => state.exchange.transaction.isSuccessful
  );
  const isError = useSelector((state) => state.exchange.transaction.isError);

  const removeAlertHandler = () => {
    alertRef.current.className = "alert alert--remove";
  };

  useEffect(() => {
    // If successful, check if alert was already displayed
    // If yes, update the cookie with most recent transaction hash
    // If not, it won't display the alert
    if (
      isSuccessful &&
      account &&
      alertRef.current.className !== null &&
      events
    ) {
      let lastTransaction = document.cookie.split("=")[1];
      if (String(lastTransaction) !== String(events[0].transactionHash)) {
        document.cookie = `lastTransactionHash=${String(
          events[0].transactionHash
        )}`;
        alertRef.current.className = "alert";
      } else {
        alertRef.current.className = "alert alert--remove";
      }
    }

    // If is pending or error, just display the alert
    if ((isPending || isError) && account && alertRef.current !== null) {
      alertRef.current.className = "alert";
    }
  }, [isPending, isSuccessful, isError, account, events]);

  // TODO: Alert.js
  // Problem when transaction is successful and we try
  return (
    <div>
      {isPending ? (
        <div
          ref={alertRef}
          onClick={removeAlertHandler}
          className="alert alert--remove"
        >
          <h1>Transaction Pending...</h1>
          <img src={closeButton} alt="close" className="button--close" />
        </div>
      ) : isSuccessful && events[0] ? (
        <div
          ref={alertRef}
          onClick={removeAlertHandler}
          className="alert alert--remove"
        >
          <h1>Transaction Successful</h1>
          <a
            href={
              config[network]
                ? `${config[network].explorerUrl}/tx/${events[0].transactionHash}`
                : "#"
            }
            target="_blank"
            rel="noreferrer"
          >
            {events[0] &&
              `${events[0].transactionHash.slice(
                0,
                6
              )}...${events[0].transactionHash.slice(-6)}`}
          </a>
          <img src={closeButton} alt="close" className="button--close" />
        </div>
      ) : isError ? (
        <div
          ref={alertRef}
          onClick={removeAlertHandler}
          className="alert alert--remove"
        >
          <h1>Transaction Will Fail</h1>
          <img src={closeButton} alt="close" className="button--close" />
        </div>
      ) : (
        // No transaction happening
        <span></span>
      )}

      {/* <div className="alert alert--remove"></div> */}
    </div>
  );
};

export default Alert;
