import { BigNumber, ethers } from "ethers";
import { TOKEN_ABI } from "../abis/Token";
import { EXCHANGE_ABI } from "../abis/Exchange";
import { FREETOKENS_ABI } from "../abis/FreeTokens";
import { useSelector } from "react-redux";

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
  let reserved = ethers.utils.formatEther(
    await exchange.reservedTokens(tokens[0].address, account)
  );
  dispatch({
    type: "RESERVED_TOKEN_1_BALANCE_LOADED",
    reservedToken: reserved,
  });
  // Token2
  reserved = ethers.utils.formatEther(
    await exchange.reservedTokens(tokens[1].address, account)
  );
  dispatch({
    type: "RESERVED_TOKEN_2_BALANCE_LOADED",
    reservedToken: reserved,
  });
};

export const loadFreeTokensContract = async (address, provider, dispatch) => {
  const contract = new ethers.Contract(address, FREETOKENS_ABI, provider);

  dispatch({ type: "GIVEAWAY_CONTRACT_LOADED", contract });
};

export const loadGiveawayInfo = async (contract, user, dispatch) => {
  const ONE_DAY = 24 * 60 * 60;
  const lastTransfer = BigNumber.from(
    await contract.lastTransfer(user)
  ).toNumber();

  const timeNow = new Date();
  const timeNow_Unix = Math.floor(timeNow.getTime() / 1000);

  const available = timeNow_Unix - lastTransfer >= ONE_DAY;

  dispatch({ type: "GIVEAWAY_INFO_LOADED", available });
};

export const giveTokens = async (provider, contract, dispatch) => {
  const signer = await provider.getSigner();

  dispatch({ type: "GIVEAWAY_REQUEST" });
  try {
    const transaction = await contract
      .connect(signer)
      .transferToUser(ethers.utils.parseUnits(String("100"), "ether"));
    await transaction.wait();
    dispatch({ type: "GIVEAWAY_SUCCESS" });
  } catch (error) {
    dispatch({ type: "GIVEAWAY_FAIL" });
    console.error(error);
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

      dispatch({ type: "NEW_ORDER_SUCCESS", order, event, amountGive });
      dispatch({
        type: "UPDATE_RESERVED",
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
      .makeOrder(tokenGet, amountGet, tokenGive, amountGive, {
        gasLimit: 1_000_000,
      });
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

//---------------------------------------------------
// ORDERS (CANCEL & FILL)
export const cancelOrder = async (provider, exchange, order, dispatch) => {
  dispatch({ type: "ORDER_CANCEL_REQUEST" });

  try {
    const signer = await provider.getSigner();
    const transaction = await exchange.connect(signer).cancelOrder(order.id);
    await transaction.wait();
  } catch (error) {
    dispatch({ type: "ORDER_CANCEL_FAIL" });
  }
};

export const fillOrder = async (provider, exchange, order, dispatch) => {
  dispatch({ type: "ORDER_FILL_REQUEST" });

  try {
    const signer = await provider.getSigner();
    const transaction = await exchange.connect(signer).fillOrder(order.id);
    await transaction.wait();
  } catch (error) {
    dispatch({ type: "ORDER_FILL_FAIL" });
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
