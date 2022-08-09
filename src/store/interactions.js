import { ethers } from "ethers";
import config from "../config.json";
import { TOKEN_ABI } from "../abis/Token";
import { EXCHANGE_ABI } from "../abis/Exchange";

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
  console.log(addresses);
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
  const exchange = new ethers.Contract(address, EXCHANGE_ABI, provider);

  dispatch({ type: "EXCHANGE_LOADED", exchange });

  return exchange;
};
