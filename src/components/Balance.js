import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import imageLogo from "../assets/dapp.svg";
import { loadBalances, transferTokens } from "../store/interactions";

const Balance = () => {
  const [token1TransferAmount, setToken1TransferAmount] = useState("");
  const [token2TransferAmount, setToken2TransferAmount] = useState("");

  const dispatch = useDispatch();

  const provider = useSelector((state) => state.provider.connection);
  const account = useSelector((state) => state.provider.account);

  const exchange = useSelector((state) => state.exchange.contract);
  const exchangeBalances = useSelector((state) => state.exchange.balances);
  const transferInProgress = useSelector(
    (state) => state.exchange.transferInProgress
  );

  const tokens = useSelector((state) => state.tokens.contracts);
  const symbols = useSelector((state) => state.tokens.symbols);
  const tokenBalances = useSelector((state) => state.tokens.balances);

  useEffect(() => {
    if (exchange && tokens && account) {
      loadBalances(exchange, tokens, account, dispatch);
    }
  }, [exchange, tokens, account, transferInProgress]);

  const amountHandler = (e, token) => {
    if (token.address === tokens[0].address) {
      setToken1TransferAmount(e.target.value);
    }
    if (token.address === tokens[1].address) {
      setToken2TransferAmount(e.target.value);
    }
  };

  const depositHandler = (e, token) => {
    e.preventDefault();
    if (token.address === tokens[0].address) {
      transferTokens(
        provider,
        exchange,
        "Deposit",
        token,
        token1TransferAmount,
        dispatch
      );
    } else if (token.address === tokens[1].address) {
    }
  };

  return (
    <div className="component exchange__transfers">
      <div className="component__header flex-between">
        <h2>Balance</h2>
        <div className="tabs">
          <button className="tab tab--active">Deposit</button>
          <button className="tab">Withdraw</button>
        </div>
      </div>

      {/* Deposit/Withdraw Component 1 (DApp) */}

      <div className="exchange__transfers--form">
        <div className="flex-between">
          <p>
            <small>Token</small>
            <br />
            <img src={imageLogo} alt="token logo" />
            {symbols && symbols[0]}
          </p>
          <p>
            <small>Wallet</small>
            <br />
            {tokenBalances && tokenBalances[0]}
          </p>
          <p>
            <small>Exchange</small>
            <br />
            {exchangeBalances && exchangeBalances[0]}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            depositHandler(e, tokens[0]);
          }}
        >
          <label htmlFor="token0">{symbols && symbols[0]} amount</label>
          {tokens ? (
            <input
              id="token0"
              type="text"
              placeholder="0.0000"
              value={token1TransferAmount}
              onChange={(e) => {
                amountHandler(e, tokens[0]);
              }}
            />
          ) : (
            <input placeholder="Loading.." />
          )}

          <button className="button" type="submit">
            <span></span>
          </button>
        </form>
      </div>

      <hr />

      {/* Deposit/Withdraw Component 2 (mETH) */}

      <div className="exchange__transfers--form">
        <div className="flex-between"></div>

        <form>
          <label htmlFor="token1">{symbols && symbols[1]} amount</label>
          {tokens ? (
            <input
              id="token1"
              type="text"
              placeholder="0.0000"
              value={token2TransferAmount}
              onChange={(e) => {
                amountHandler(e, tokens[1]);
              }}
            />
          ) : (
            <input placeholder="Loading.." />
          )}

          <button className="button" type="submit">
            <span></span>
          </button>
        </form>
      </div>

      <hr />
    </div>
  );
};

export default Balance;
