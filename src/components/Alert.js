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
  console.log("alert.js", events);

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
    if (
      (isPending || isError || isSuccessful) &&
      account &&
      alertRef.current !== null
    ) {
      console.log(alertRef);
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
