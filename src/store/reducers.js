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

const DEFAULT_TOKENS_STATE = {
  loaded: false,
  contracts: [],
  symbols: [],
  balances: [],
};
export const tokens = (state = DEFAULT_TOKENS_STATE, action) => {
  switch (action.type) {
    case "TOKEN_1_LOADED":
      return {
        ...state,
        contracts: [action.token],
        symbols: [action.symbol],
      };
    case "TOKEN_1_BALANCE_LOADED":
      return {
        ...state,
        balances: [action.balance],
      };
    case "TOKEN_2_LOADED":
      return {
        ...state,
        contracts: [...state.contracts, action.token],
        symbols: [...state.symbols, action.symbol],
      };
    case "TOKEN_2_BALANCE_LOADED":
      return {
        ...state,
        loaded: true,
        balances: [...state.balances, action.balance],
      };
    default:
      return state;
  }
};

const DEFAULT_EXCHANGE_STATE = {
  loaded: false,
  contract: {},
  balances: [],
  events: [],
  allOrders: {
    data: [],
  },
  transaction: {
    transactionType: "",
    isPending: false,
    isSuccessful: false,
    isError: false,
  },
  transferInProgress: false,
};
export const exchange = (state = DEFAULT_EXCHANGE_STATE, action) => {
  switch (action.type) {
    case "EXCHANGE_LOADED":
      return {
        ...state,
        loaded: true,
        contract: action.exchange,
      };
    case "EXCHANGE_TOKEN_1_BALANCE_LOADED":
      return {
        ...state,
        balances: [action.balance],
      };
    case "EXCHANGE_TOKEN_2_BALANCE_LOADED":
      return {
        ...state,
        balances: [...state.balances, action.balance],
      };
    case "TRANSFER_REQUEST":
      return {
        ...state,
        transaction: {
          transactionType: "Transfer",
          isPending: true,
          isSuccessful: false,
        },
        transferInProgress: true,
      };
    case "TRANSFER_SUCCESS":
      return {
        ...state,
        transaction: {
          transactionType: "Transfer",
          isPending: false,
          isSuccessful: true,
        },
        transferInProgress: false,
        events: [action.event, ...state.events],
      };
    case "TRANSFER_FAIL":
      return {
        ...state,
        transaction: {
          transactionType: "Transfer",
          isPending: false,
          isSuccessful: false,
          isError: true,
        },
        transferInProgress: false,
        events: [action.event, ...state.events],
      };
    case "NEW_ORDER_REQUEST":
      return {
        ...state,
        transaction: {
          transactionType: "New Order",
          isPending: true,
          isSuccessful: false,
          isError: false,
        },
        events: [action.event, ...state.events],
      };
    case "NEW_ORDER_FAIL":
      return {
        ...state,
        transaction: {
          transactionType: "New Order",
          isPending: false,
          isSuccessful: false,
          isError: true,
        },
        events: [action.event, ...state.events],
      };
    case "NEW_ORDER_SUCCESS":
      let data;
      let index = state.allOrders.data.findIndex(
        (order) => order.id === action.orderId
      );
      if (index === -1) {
        data = [...state.allOrders.data, action.order];
      } else {
        data = state.allOrders.data;
      }
      return {
        ...state,
        allOrders: {
          ...state.allOrders,
          data,
        },
        transaction: {
          transactionType: "New Order",
          isPending: false,
          isSuccessful: true,
          isError: false,
        },
        events: [action.event, ...state.events],
      };
    default:
      return state;
  }
};
