import { BigNumber, ethers } from "ethers";
import { TOKEN_ABI } from "../abis/Token";
import { EXCHANGE_ABI } from "../abis/Exchange";
import { FREETOKENS_ABI } from "../abis/FreeTokens";
import { useSelector } from "react-redux";
import config from "../config.json";

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
  // Loading wallet balances...
  // Token 1
  let balance = ethers.utils.formatEther(await tokens[0].balanceOf(account));
  dispatch({ type: "TOKEN_1_BALANCE_LOADED", balance });
  // Token 2
  balance = ethers.utils.formatEther(await tokens[1].balanceOf(account));
  dispatch({ type: "TOKEN_2_BALANCE_LOADED", balance });

  // Loading exchange balances...
  // Token1
  balance = ethers.utils.formatEther(
    await exchange.balanceOf(tokens[0].address, account)
  );
  dispatch({ type: "EXCHANGE_TOKEN_1_BALANCE_LOADED", balance });
  // Token2
  balance = ethers.utils.formatEther(
    await exchange.balanceOf(tokens[1].address, account)
  );
  dispatch({ type: "EXCHANGE_TOKEN_2_BALANCE_LOADED", balance });
};

export const loadReservedTokens = async (
  exchange,
  tokens,
  account,
  dispatch
) => {
  // Loading reserved tokens...
  // Token1
  let token1 = ethers.utils.formatEther(
    await exchange.reservedTokens(tokens[0].address, account)
  );
  let token2 = ethers.utils.formatEther(
    await exchange.reservedTokens(tokens[1].address, account)
  );
  dispatch({
    type: "RESERVED_TOKENS_BALANCE_LOADED",
    amounts: [token1, token2],
  });
};

export const loadFreeTokensContract = async (address, provider, dispatch) => {
  const contract = new ethers.Contract(address, FREETOKENS_ABI, provider);

  dispatch({ type: "GIVEAWAY_CONTRACT_LOADED", contract });
  return contract;
};

export const loadGiveawayInfo = async (contract, user, dispatch) => {
  const ONE_DAY = 24 * 60 * 60;

  // Getting the timestamp (UNIX)
  // of the last time the user received tokens....
  const lastTransfer = BigNumber.from(
    await contract.lastTransfer(user)
  ).toNumber();

  // and from right now... (also UNIX)
  const timeNow = new Date();
  const timeNow_Unix = Math.floor(timeNow.getTime() / 1000);

  // Checking 24h cooldown...
  const available = timeNow_Unix - lastTransfer >= ONE_DAY;

  dispatch({ type: "GIVEAWAY_INFO_LOADED", available });
};

export const giveTokens = async (provider, contract, dispatch) => {
  const signer = await provider.getSigner();

  const DONATION_AMOUNT = "100";

  dispatch({ type: "GIVEAWAY_REQUEST" });
  try {
    const transaction = await contract
      .connect(signer)
      .transferToUser(ethers.utils.parseUnits(DONATION_AMOUNT, "ether"));
    await transaction.wait();
    dispatch({ type: "GIVEAWAY_SUCCESS" });
    dispatch({ type: "GIVEAWAY_UPDATE_WALLET", amount: DONATION_AMOUNT });
  } catch (error) {
    handleError(error.message, "Giveaway", dispatch);
  }
};

//---------------------------------------------------
// LOADING ALL ORDERS
export const loadAllOrders = async (provider, exchange, dispatch) => {
  const block = await provider.getBlockNumber();

  // Fetch canceled orders
  const cancelStream = await exchange.queryFilter("Cancel", 0, block);
  const cancelledOrders = cancelStream.map((event) => event.args);
  dispatch({ type: "CANCELLED_ORDERS_LOADED", cancelledOrders });

  // Fetch filled orders
  const tradeStream = await exchange.queryFilter("Trade", 0, block);
  const filledOrders = tradeStream.map((event) => event.args);
  dispatch({ type: "FILLED_ORDERS_LOADED", filledOrders });

  // Fetch all orders
  const orderStream = await exchange.queryFilter("Order", 0, block);
  const allOrders = orderStream.map((event) => event.args);
  dispatch({ type: "ALL_ORDERS_LOADED", allOrders });
};

//---------------------------------------------------
// SUBCRIBING TO EVENTS ON BLOCKCHAIN

export const subscribeToEvents = (exchange, giveaway, dispatch) => {
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

      dispatch({ type: "NEW_ORDER_SUCCESS", order, event, amountGive });
      dispatch({
        type: "UPDATE_RESERVED",
        tokenGive,
        amountGive,
      });
    }
  );

  exchange.on(
    "Cancel",
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
      dispatch({ type: "ORDER_CANCEL_SUCCESS", order, event });
      dispatch({
        type: "UPDATE_RESERVED",
      });
    }
  );
  exchange.on(
    "Trade",
    (
      id,
      user,
      tokenGet,
      amountGet,
      tokenGive,
      amountGive,
      creator,
      timestamp,
      event
    ) => {
      const order = event.args;
      dispatch({ type: "ORDER_FILL_SUCCESS", order, event });
      dispatch({
        type: "UPDATE_RESERVED",
      });
    }
  );

  giveaway.on("Donation", (amount, to, event) => {
    dispatch({ type: "GIVEAWAY_SUCCESS", event });
  });
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

  dispatch({ type: "TRANSFER_REQUEST" });
  // Depositing or display error message...
  if (transferType === "Deposit") {
    try {
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
    } catch (error) {
      handleError(error.message, "Transfer", dispatch);
    }

    // Withdrawing or display error message...
  } else if (transferType === "Withdraw") {
    try {
      // Withdrawing tokens...
      transaction = await exchange
        .connect(signer)
        .withdrawToken(token.address, amountToTransfer);
      await transaction.wait();
    } catch (error) {
      handleError(error.message, "Transfer", dispatch);
    }
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
      .makeOrder(tokenGet, amountGet, tokenGive, amountGive, {
        gasLimit: 1_000_000,
      });
    await transaction.wait();
  } catch (error) {
    handleError(error.message, "Order", dispatch);
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
    handleError(error.message, "Order", dispatch);
  }
};

//---------------------------------------------------
// ORDERS (CANCEL & FILL)
export const cancelOrder = async (provider, exchange, order, dispatch) => {
  dispatch({ type: "ORDER_CANCEL_REQUEST" });

  try {
    const signer = await provider.getSigner();
    const transaction = await exchange.connect(signer).cancelOrder(order.id);
    await transaction.wait();
  } catch (error) {
    handleError(error.message, "Cancel Order", dispatch);
  }
};

export const fillOrder = async (provider, exchange, order, dispatch) => {
  dispatch({ type: "ORDER_FILL_REQUEST" });

  try {
    const signer = await provider.getSigner();
    const transaction = await exchange.connect(signer).fillOrder(order.id);
    await transaction.wait();
  } catch (error) {
    handleError(error.message, "Fill Order", dispatch);
  }
};

//---------------------------------------------------
// UTILITIES
export const formatAmount = (amount) => {
  return Number(ethers.utils.formatEther(String(amount)));
};

export const orderIdDoesNotExist = (allOrders, orderToVerify) => {
  return (
    allOrders.findIndex(
      (order) => String(order.id) === String(orderToVerify.id)
    ) === -1
  );
};

export const removeRepeatedAlerts = (
  isSuccessful,
  isPending,
  isError,
  account,
  alertRef,
  events
) => {
  if (isSuccessful) {
    if (alertRef.current.className !== null && account && events) {
      let lastTransaction = document.cookie.split("=")[1];
      let isNewTransaction =
        String(lastTransaction) !== String(events[0].transactionHash);
      if (isNewTransaction) {
        // Updating cookie with current transaction hash
        document.cookie = `lastTransactionHash=${String(
          events[0].transactionHash
        )}`;
        // Dispĺaying Alert
        alertRef.current.className = "alert";
      } else {
        // Transaction already displayed,
        // remove alert
        alertRef.current.className = "alert alert--remove";
      }
    }
  }

  // If is pending or error, just display the alert
  if ((isPending || isError) && account && alertRef.current !== null) {
    alertRef.current.className = "alert";
  }
};

export const selectFaucet = (chainId, dispatch) => {
  dispatch({ type: "FAUCET_LINK_LOADED", faucet: config[chainId].faucet });
  return config[chainId].faucet;
};

//---------------------------------------------------
// HANDLING ERRORS
export const handleError = (msg, transactionType, dispatch) => {
  const ERROR_LIST = [
    "Wait 24 hours before the next transfer.",
    "Transfer to exchange not completed",
    "Insufficient balance to withdraw",
    "Insufficient balance for creating order",
    "User denied transaction signature.",
    "Insufficient funds to complete order",
    "Not connected to the blockchain.",
  ];

  for (let i = 0; i < ERROR_LIST.length; i++) {
    if (msg.includes(ERROR_LIST[i])) {
      dispatch({
        type: "TRANSACTION_ERROR",
        transactionType,
        msg: ERROR_LIST[i],
      });
      break;
    }
  }
};

//---------------------------------------------------
// HANDLING NETWORK
export const ACCEPTED_NETWORKS = ["5", "11155111"];

export const changeNetwork = async (chainId, dispatch) => {
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId }],
  });
  dispatch({ type: "RIGHT_NETWORK_SELECTED" });
  window.location.reload();
};
