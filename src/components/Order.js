import { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { makeBuyOrder, makeSellOrder } from "../store/interactions";

const Order = () => {
  const dispatch = useDispatch();

  const buyRef = useRef(null);
  const sellRef = useRef(null);

  const [isBuy, setIsBuy] = useState(true);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");

  const provider = useSelector((state) => state.provider.connection);
  const exchange = useSelector((state) => state.exchange.contract);
  const tokens = useSelector((state) => state.tokens.contracts);
  const tokenBalances = useSelector((state) => state.tokens.balances);
  const transaction = useSelector((state) => state.exchange.transaction);

  const tabHandler = (e) => {
    if (e.target.className !== buyRef.current.className) {
      e.target.className = "tab tab--active";
      buyRef.current.className = "tab";
      setIsBuy(false);
    } else if (e.target.className !== sellRef.current.className) {
      e.target.className = "tab tab--active";
      sellRef.current.className = "tab";
      setIsBuy(true);
    }
  };

  const buyHandler = (e) => {
    e.preventDefault();

    if (tokenBalances) {
      if (Number(price) >= 0 && Number(price) <= Number(tokenBalances[0])) {
        const order = { amount, price };
        makeBuyOrder(provider, exchange, tokens, order, dispatch);
      }
    }
    setAmount("");
    setPrice("");
  };

  const sellHandler = (e) => {
    e.preventDefault();

    if (tokenBalances) {
      if (Number(amount) >= 0 && Number(amount) <= Number(tokenBalances[0])) {
        const order = { amount, price };
        makeSellOrder(provider, exchange, tokens, order, dispatch);
      }
    }
    setAmount("");
    setPrice("");
  };

  return (
    <div className="component exchange__orders">
      <div className="component__header flex-between">
        <h2>New Order</h2>
        <div className="tabs">
          <button onClick={tabHandler} ref={buyRef} className="tab tab--active">
            Buy
          </button>
          <button onClick={tabHandler} ref={sellRef} className="tab">
            Sell
          </button>
        </div>
      </div>

      <form onSubmit={isBuy ? buyHandler : sellHandler}>
        {isBuy ? (
          <label htmlFor="amount">Buy Amount</label>
        ) : (
          <label htmlFor="amount">Sell Amount</label>
        )}

        <input
          type="text"
          id="amount"
          placeholder="0.0000"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
          }}
        />

        {isBuy ? (
          <label htmlFor="price">Buy Price</label>
        ) : (
          <label htmlFor="price">Sell Price</label>
        )}
        <input
          type="text"
          id="price"
          placeholder="0.0000"
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
          }}
        />

        {isBuy ? (
          <button className="button button--filled" type="submit">
            Buy Order
          </button>
        ) : (
          <button className="button button--filled" type="submit">
            Sell Order
          </button>
        )}
      </form>
    </div>
  );
};

export default Order;
