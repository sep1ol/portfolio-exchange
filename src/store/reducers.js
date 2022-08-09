const DEFAULT_PROVIDER_STATE = {
  connection: null,
  chainId: null,
  account: null,
};
export const provider = (state = DEFAULT_PROVIDER_STATE, action) => {
  switch (action.type) {
    case "PROVIDER_LOADED":
      return {
        ...state,
        connection: action.connection,
      };
    case "NETWORK_LOADED":
      return {
        ...state,
        chainId: action.chainId,
      };
    case "ACCOUNT_LOADED":
      return {
        ...state,
        account: action.account,
      };
    case "ETHER_BALANCE_LOADED":
      return {
        ...state,
        balance: action.balance,
      };
    default:
      return state;
  }
};

const DEFAULT_TOKENS_STATE = { loaded: false, contracts: [], symbols: [] };
export const tokens = (state = DEFAULT_TOKENS_STATE, action) => {
  switch (action.type) {
    case "TOKEN_1_LOADED":
      console.log(state.contracts);
      return {
        ...state,
        contracts: [...state.contracts, action.token],
        symbols: [...state.symbols, action.symbol],
      };
    case "TOKEN_2_LOADED":
      return {
        ...state,
        contracts: [...state.contracts, action.token],
        symbols: [...state.symbols, action.symbol],
      };
    case "TOKEN_3_LOADED":
      return {
        ...state,
        loaded: true,
        contracts: [...state.contracts, action.token],
        symbols: [...state.symbols, action.symbol],
      };
    default:
      return state;
  }
};

const DEFAULT_EXCHANGE_STATE = { loaded: false, contracts: {} };
export const exchange = (state = DEFAULT_EXCHANGE_STATE, action) => {
  switch (action.type) {
    case "EXCHANGE_LOADED":
      return {
        ...state,
        loaded: true,
        contract: action.exchange,
      };
    default:
      return state;
  }
};
