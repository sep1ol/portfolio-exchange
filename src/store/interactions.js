import { ethers } from "ethers";
import { TOKEN_ABI } from "../abis/Token";
import { EXCHANGE_ABI } from "../abis/Exchange";
import { useDispatch } from "react-redux";

//---------------------------------------------------
// LOADING INFORMATION TO WEBSITE

export const loadAccount = async (dispatch, provider) => {
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const account = ethers.utils.getAddress(accounts[0]);

  let balance = await provider.getBalance(account);
  balance = ethers.utils.formatEther(balance);

  dispatch({
    type: "ACCOUNT_LOADED",
    account,
  });

  dispatch({
    type: "ETHER_BALANCE_LOADED",
    balance,
  });

  return { account, balance };
};

export const loadProvider = (dispatch) => {
  const connection = new ethers.providers.Web3Provider(window.ethereum);

  dispatch({
    type: "PROVIDER_LOADED",
    connection,
  });

  return connection;
};

export const loadNetwork = async (provider, dispatch) => {
  const { chainId } = await provider.getNetwork();

  dispatch({ type: "NETWORK_LOADED", chainId });

  return chainId;
};

export const loadTokens = async (addresses, provider, dispatch) => {
  // Loading token 1...
  let token = new ethers.Contract(addresses[0], TOKEN_ABI, provider);
  let symbol = await token.symbol();
  dispatch({ type: `TOKEN_1_LOADED`, token, symbol });

  // Loading token 2...
  token = new ethers.Contract(addresses[1], TOKEN_ABI, provider);
  symbol = await token.symbol();
  dispatch({ type: `TOKEN_2_LOADED`, token, symbol });
};

export const loadExchange = async (address, provider, dispatch) => {
  // Loading contract...
  const exchange = new ethers.Contract(address, EXCHANGE_ABI, provider);
  dispatch({ type: "EXCHANGE_LOADED", exchange });

  return exchange;
};

export const loadBalances = async (exchange, tokens, account, dispatch) => {
  let balance = ethers.utils.formatEther(await tokens[0].balanceOf(account));
  dispatch({ type: "TOKEN_1_BALANCE_LOADED", balance });

  balance = ethers.utils.formatEther(await tokens[1].balanceOf(account));
  dispatch({ type: "TOKEN_2_BALANCE_LOADED", balance });

  balance = ethers.utils.formatEther(
    await exchange.balanceOf(tokens[0].address, account)
  );
  dispatch({ type: "EXCHANGE_TOKEN_1_BALANCE_LOADED", balance });

  balance = ethers.utils.formatEther(
    await exchange.balanceOf(tokens[1].address, account)
  );
  dispatch({ type: "EXCHANGE_TOKEN_2_BALANCE_LOADED", balance });
};

//---------------------------------------------------
// SUBCRIBING TO EVENTS ON BLOCKCHAIN

export const subscribeToEvents = (exchange, dispatch) => {
  exchange.on("Deposit", (token, user, amount, balance, event) => {
    dispatch({ type: "TRANSFER_SUCCESS", event });
  });

  exchange.on("Withdraw", (token, user, amount, balance, event) => {
    dispatch({ type: "TRANSFER_SUCCESS", event });
  });

  exchange.on(
    "Order",
    (
      id,
      user,
      tokenGet,
      amountGet,
      tokenGive,
      amountGive,
      timestamp,
      event
    ) => {
      const order = event.args;
      dispatch({ type: "NEW_ORDER_SUCCESS", order, event });
    }
  );
};

//---------------------------------------------------
// TRANSFER TOKENS (DEPOSITS & WITHDRAWS)

export const transferTokens = async (
  provider,
  exchange,
  transferType,
  token,
  amount,
  dispatch
) => {
  let transaction;

  const signer = await provider.getSigner();
  const amountToTransfer = ethers.utils.parseUnits(amount.toString(), 18);

  try {
    dispatch({ type: "TRANSFER_REQUEST" });

    if (transferType === "Deposit") {
      // Approving tokens...
      transaction = await token
        .connect(signer)
        .approve(exchange.address, amountToTransfer);
      await transaction.wait();

      // Depositing tokens to exchange...
      transaction = await exchange
        .connect(signer)
        .depositToken(token.address, amountToTransfer);
      await transaction.wait();
    } else if (transferType === "Withdraw") {
      // Withdrawing tokens...
      transaction = await exchange
        .connect(signer)
        .withdrawToken(token.address, amountToTransfer);
      await transaction.wait();
    }
  } catch (error) {
    console.error(error);
    dispatch({ type: "TRANSFER_FAIL" });
  }
};

//---------------------------------------------------
// ORDERS (BUY & SELL)
export const makeBuyOrder = async (
  provider,
  exchange,
  tokens,
  order,
  dispatch
) => {
  let transaction;

  const tokenGet = tokens[0].address;
  const tokenGive = tokens[1].address;

  const amountGet = ethers.utils.parseUnits(order.amount, 18);
  const amountGive = ethers.utils.parseUnits(
    (order.amount * order.price).toString(),
    18
  );

  dispatch({ type: "NEW_ORDER_REQUEST" });
  try {
    const signer = await provider.getSigner();
    transaction = await exchange
      .connect(signer)
      .makeOrder(tokenGet, amountGet, tokenGive, amountGive);
    await transaction.wait();
  } catch (error) {
    console.error(error);
    dispatch({ type: "NEW_ORDER_FAIL" });
  }
};

export const makeSellOrder = async (
  provider,
  exchange,
  tokens,
  order,
  dispatch
) => {
  let transaction;

  const tokenGet = tokens[1].address;
  const tokenGive = tokens[0].address;

  const amountGive = ethers.utils.parseUnits(order.amount, 18);
  const amountGet = ethers.utils.parseUnits(
    (order.amount * order.price).toString(),
    18
  );

  dispatch({ type: "NEW_ORDER_REQUEST" });
  try {
    const signer = await provider.getSigner();
    transaction = await exchange
      .connect(signer)
      .makeOrder(tokenGet, amountGet, tokenGive, amountGive);
    await transaction.wait();
  } catch (error) {
    console.error(error);
    dispatch({ type: "NEW_ORDER_FAIL" });
  }
};
