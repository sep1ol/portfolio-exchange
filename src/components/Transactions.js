import { useDispatch, useSelector } from "react-redux";
import {
  myOpenOrdersSelector,
  myFilledOrdersSelector,
} from "../store/selectors";
import { cancelOrder } from "../store/interactions";
import sort from "../assets/sort.svg";
import Banner from "./Banner";
import { useRef, useState } from "react";

const Transactions = () => {
  const dispatch = useDispatch();
  const provider = useSelector((state) => state.provider.connection);
  const exchange = useSelector((state) => state.exchange.contract);
  const symbols = useSelector((state) => state.tokens.symbols);

  const myOpenOrders = useSelector(myOpenOrdersSelector);
  const myFilledOrders = useSelector(myFilledOrdersSelector);

  const tradeRef = useRef(null);
  const orderRef = useRef(null);
  const [showOrders, setShowOrders] = useState(true);

  const tabHandler = (e) => {
    // Only works if the clicked tab is not active
    if (e.target.className === "tab") {
      // Checking which tab is not active
      if (e.target.className === orderRef.current.className) {
        // Activating clicked tab
        e.target.className = "tab tab--active";
        tradeRef.current.className = "tab";
        setShowOrders(true);
      } else if (e.target.className === tradeRef.current.className) {
        e.target.className = "tab tab--active";
        orderRef.current.className = "tab";
        setShowOrders(false);
      }
    }
  };

  const cancelHandler = (order) => {
    cancelOrder(provider, exchange, order, dispatch);
  };

  return (
    <div className="component exchange__transactions">
      {showOrders ? (
        <div>
          <div className="component__header flex-between">
            <h2>My Orders</h2>

            <div className="tabs">
              <button
                ref={orderRef}
                onClick={tabHandler}
                className="tab tab--active"
              >
                Orders
              </button>
              <button ref={tradeRef} onClick={tabHandler} className="tab">
                Trades
              </button>
            </div>
          </div>
          {!myOpenOrders || myOpenOrders.length === 0 ? (
            <Banner text="No open orders." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>
                    {symbols && symbols[0]}
                    <img src={sort} alt="Sort" />
                  </th>
                  <th>
                    {symbols && symbols[0]}/{symbols && symbols[1]}
                    <img src={sort} alt="Sort" />
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {myOpenOrders &&
                  myOpenOrders.map((order, index) => {
                    return (
                      <tr key={index}>
                        <td style={{ color: `${order.orderTypeClass}` }}>
                          {order.token0Amount}
                        </td>
                        <td>{order.tokenPrice}</td>
                        <td>
                          <button
                            onClick={() => cancelHandler(order)}
                            className="button--sm"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div>
          <div className="component__header flex-between">
            <h2>My Transactions</h2>

            <div className="tabs">
              <button
                ref={orderRef}
                onClick={tabHandler}
                className="tab tab--active"
              >
                Orders
              </button>
              <button ref={tradeRef} onClick={tabHandler} className="tab">
                Trades
              </button>
            </div>
          </div>

          {!myFilledOrders || myFilledOrders.length === 0 ? (
            <Banner text="No transactions on this account." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>
                    Time
                    <img src={sort} alt="Sort" />
                  </th>
                  <th>
                    {symbols && symbols[0]}
                    <img src={sort} alt="Sort" />
                  </th>
                  <th>
                    {symbols && symbols[0]}/{symbols && symbols[1]}
                    <img src={sort} alt="Sort" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {myFilledOrders &&
                  myFilledOrders.map((order, index) => {
                    return (
                      <tr key={index}>
                        <td>{order.formattedTimestamp}</td>
                        <td style={{ color: `${order.orderClass}` }}>
                          {order.orderSign}
                          {order.token0Amount}
                        </td>
                        <td>{order.tokenPrice}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Transactions;
