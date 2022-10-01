import dappLogo from "../assets/dapp.svg";
import ethLogo from "../assets/eth.svg";
import usdtLogo from "../assets/tether.svg";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loadBalances,
  loadReservedTokens,
  transferTokens,
} from "../store/interactions";

const Balance = () => {
  const [isDeposit, setIsDeposit] = useState(true);
  const [token1TransferAmount, setToken1TransferAmount] = useState("");
  const [token2TransferAmount, setToken2TransferAmount] = useState("");

  const depositRef = useRef(null);
  const withdrawRef = useRef(null);

  const dispatch = useDispatch();

  const provider = useSelector((state) => state.provider.connection);
  const account = useSelector((state) => state.provider.account);

  const exchange = useSelector((state) => state.exchange.contract);
  const exchangeBalances = useSelector((state) => state.exchange.balances);
  const transferInProgress = useSelector(
    (state) => state.exchange.transferInProgress
  );

  // const transactionType = useSelector(
  //   (state) => state.exchange.transaction.transactionType
  // );
  // const isSuccessful = useSelector(
  //   (state) => state.exchange.transaction.isSuccessful
  // );

  const tokens = useSelector((state) => state.tokens.contracts);
  const symbols = useSelector((state) => state.tokens.symbols);
  const tokenBalances = useSelector((state) => state.tokens.balances);
  const reserved = useSelector((state) => state.exchange.reservedBalances);
  const updateReserved = useSelector((state) => state.exchange.updateReserved);

  useEffect(() => {
    if (exchange && tokens && account) {
      loadBalances(exchange, tokens, account, dispatch);
      loadReservedTokens(exchange, tokens, account, dispatch);
    }
    if (updateReserved && exchange && tokens && account && dispatch) {
      loadReservedTokens(exchange, tokens, account, dispatch);
    }
  }, [exchange, tokens, account, transferInProgress, dispatch, updateReserved]);

  const amountHandler = (e, token) => {
    if (token.address === tokens[0].address) {
      setToken1TransferAmount(e.target.value);
    }
    if (token.address === tokens[1].address) {
      setToken2TransferAmount(e.target.value);
    }
  };

  const checkBalance = (selectedToken) => {
    // First we check if token balances is loaded
    if (tokenBalances) {
      // Select what token we're checking
      if (selectedToken === "token1") {
        // Requirements:
        return (
          // #1: Amount typed exists
          Number(token1TransferAmount) <= Number(tokenBalances[0]) &&
          // #1: Amount typed is positive
          Number(token1TransferAmount) >= 0
        );
      } else if (selectedToken === "token2") {
        return (
          Number(token2TransferAmount) <= Number(tokenBalances[0]) &&
          Number(token2TransferAmount) >= 0
        );
      }
    }
    // Default: returns false to prevent crashes
    return false;
  };

  const depositHandler = (e, token) => {
    e.preventDefault();
    if (token.address === tokens[0].address) {
      if (checkBalance("token1")) {
        transferTokens(
          provider,
          exchange,
          "Deposit",
          token,
          token1TransferAmount,
          dispatch
        );
      }
      setToken1TransferAmount("");
    } else if (token.address === tokens[1].address) {
      if (checkBalance("token2")) {
        transferTokens(
          provider,
          exchange,
          "Deposit",
          token,
          token2TransferAmount,
          dispatch
        );
      }
      setToken2TransferAmount("");
    }
  };

  const withdrawHandler = (e, token) => {
    e.preventDefault();
    if (token.address === tokens[0].address) {
      if (checkBalance("token1")) {
        transferTokens(
          provider,
          exchange,
          "Withdraw",
          token,
          token1TransferAmount,
          dispatch
        );
      }
      setToken1TransferAmount("");
    } else if (token.address === tokens[1].address) {
      if (checkBalance("token2")) {
        transferTokens(
          provider,
          exchange,
          "Withdraw",
          token,
          token2TransferAmount,
          dispatch
        );
      }
      setToken2TransferAmount("");
    }
  };

  const tabHandler = (e) => {
    if (e.target.className !== depositRef.current.className) {
      e.target.className = "tab tab--active";
      depositRef.current.className = "tab";
      setIsDeposit(false);
    } else if (e.target.className !== withdrawRef.current.className) {
      e.target.className = "tab tab--active";
      withdrawRef.current.className = "tab";
      setIsDeposit(true);
    }
  };

  return (
    <div className="component exchange__transfers">
      <div className="component__header flex-between">
        <h2>Balance</h2>
        <div className="tabs">
          <button
            onClick={(e) => {
              tabHandler(e);
            }}
            ref={depositRef}
            className="tab tab--active"
          >
            Deposit
          </button>
          <button
            onClick={(e) => {
              tabHandler(e);
            }}
            className="tab"
            ref={withdrawRef}
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Deposit/Withdraw Component 1 (SEPT) */}
      <div className="exchange__transfers--form">
        <div className="flex-between">
          <p>
            <small>Token</small>
            <br />
            <img src={dappLogo} alt="token logo" />
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
          <p>
            <small>Orders</small>
            <br />
            {reserved && reserved[0]}
          </p>
        </div>

        <form
          onSubmit={
            isDeposit
              ? (e) => {
                  depositHandler(e, tokens[0]);
                }
              : (e) => {
                  withdrawHandler(e, tokens[0]);
                }
          }
        >
          {symbols ? (
            <label htmlFor="token0">{symbols[0]} amount</label>
          ) : (
            <label htmlFor="token0">2nd Token Amount</label>
          )}

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
            {isDeposit ? <span>Deposit</span> : <span>Withdraw</span>}
          </button>
        </form>
      </div>

      <hr />

      {/* Deposit/Withdraw Component 2 (mETH) */}

      <div className="exchange__transfers--form">
        <div className="flex-between">
          <p>
            <small>Token</small>
            <br />
            <img
              src={symbols[1] === "mETH" ? ethLogo : usdtLogo}
              alt="Token Logo"
            />
            {symbols && symbols[1]}
          </p>
          <p>
            <small>Wallet</small>
            <br />
            {tokenBalances && tokenBalances[1]}
          </p>
          <p>
            <small>Exchange</small>
            <br />
            {exchangeBalances && exchangeBalances[1]}
          </p>
          <p>
            <small>Orders</small>
            <br />
            {reserved && reserved[1]}
          </p>
        </div>

        <form
          onSubmit={
            isDeposit
              ? (e) => {
                  depositHandler(e, tokens[1]);
                }
              : (e) => {
                  withdrawHandler(e, tokens[1]);
                }
          }
        >
          {symbols ? (
            <label htmlFor="token1">{symbols[1]} amount</label>
          ) : (
            <label htmlFor="token1">2nd Token Amount</label>
          )}

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
            {isDeposit ? <span>Deposit</span> : <span>Withdraw</span>}
          </button>
        </form>
      </div>

      <hr />
    </div>
  );
};

export default Balance;
