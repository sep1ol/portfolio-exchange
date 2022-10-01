import { orderIdDoesNotExist } from "./interactions";

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
  reservedBalances: [],
  updateReservedTokens: false,
  events: [],
  allOrders: {
    loaded: false,
    data: [],
  },
  filledOrders: {
    loaded: false,
    data: [],
  },
  cancelledOrders: {
    loaded: false,
    data: [],
  },
  transaction: {
    transactionType: "",
    isPending: false,
    isSuccessful: false,
    isError: false,
  },
  transferInProgress: false,
  contractErrorMessage: "",
};
export const exchange = (state = DEFAULT_EXCHANGE_STATE, action) => {
  switch (action.type) {
    //----------------------------------
    // LOADING EXCHANGE
    case "EXCHANGE_LOADED":
      return {
        ...state,
        loaded: true,
        contract: action.exchange,
      };
    //----------------------------------
    // LOADING ORDERS
    case "CANCELLED_ORDERS_LOADED":
      return {
        ...state,
        cancelledOrders: {
          loaded: true,
          data: action.cancelledOrders,
        },
      };
    case "FILLED_ORDERS_LOADED":
      return {
        ...state,
        filledOrders: {
          loaded: true,
          data: action.filledOrders,
        },
      };
    case "ALL_ORDERS_LOADED":
      return {
        ...state,
        allOrders: {
          loaded: true,
          data: action.allOrders,
        },
      };
    //----------------------------------
    // LOADING TOKENS
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
    //----------------------------------
    // LOADING RESERVED TOKENS
    case "RESERVED_TOKEN_1_BALANCE_LOADED":
      return {
        ...state,
        reservedBalances: [action.reservedToken],
        updateReserved: false,
      };
    case "RESERVED_TOKEN_2_BALANCE_LOADED":
      return {
        ...state,
        reservedBalances: [...state.reservedBalances, action.reservedToken],
        updateReserved: false,
      };
    //----------------------------------
    // UPDATE RESERVED TOKENS AFTER EVENTS
    case "UPDATE_RESERVED":
      return {
        ...state,
        updateReserved: true,
      };
    //----------------------------------
    // TRANSFER REQUESTS
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
        contractErrorMessage: action.contractErrorMessage,
        transaction: {
          transactionType: "Transfer",
          isPending: false,
          isSuccessful: false,
          isError: true,
        },
        transferInProgress: false,
      };
    //----------------------------------
    // ORDER REQUESTS
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
        contractErrorMessage: action.contractErrorMessage,
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
      // Is current order already on state?
      // If yes, we'll get it's position, if no we'll get -1
      let index = state.allOrders.data.findIndex(
        (order) => String(order.id) === String(action.orderId)
      );
      if (index === -1) {
        // If not found, add it...
        return {
          ...state,
          allOrders: {
            ...state.allOrders,
            data: [...state.allOrders.data, action.order],
          },
          transaction: {
            transactionType: "New Order",
            isPending: false,
            isSuccessful: true,
            isError: false,
          },
          events: [action.event, ...state.events],
        };
      } else {
        // If item is already included,
        // return state as it is
        return state;
      }

    //----------------------------------
    // ORDER CANCEL REQUESTS
    case "ORDER_CANCEL_REQUEST":
      return {
        ...state,
        transaction: {
          transactionType: "Cancel Order",
          isPending: true,
          isSuccessful: false,
          isError: false,
        },
      };
    case "ORDER_CANCEL_SUCCESS":
      return {
        ...state,
        transaction: {
          transactionType: "Cancel Order",
          isPending: false,
          isSuccessful: true,
          isError: false,
        },
        cancelledOrders: {
          data: [...state.cancelledOrders.data, action.order],
        },
      };
    case "ORDER_CANCEL_FAIL":
      return {
        ...state,
        transaction: {
          transactionType: "Cancel Order",
          isPending: false,
          isSuccessful: false,
          isError: true,
        },
      };
    //----------------------------------
    // ORDER FILL REQUESTS
    case "ORDER_FILL_REQUEST":
      return {
        ...state,
        transaction: {
          transactionType: "Fill Order",
          isPending: true,
          isSuccessful: false,
          isError: false,
        },
      };
    case "ORDER_FILL_FAIL":
      return {
        ...state,
        transaction: {
          transactionType: "Fill Order",
          isPending: false,
          isSuccessful: false,
          isError: true,
        },
      };
    case "ORDER_FILL_SUCCESS":
      // Prevent duplicate orders
      // Checking if id was already confirmed
      if (orderIdDoesNotExist(state.filledOrders.data, action.order)) {
        return {
          ...state,
          transaction: {
            transactionType: "Fill Order",
            isPending: false,
            isSuccessful: true,
            isError: false,
          },
          filledOrders: {
            ...state.filledOrders,
            data: [...state.filledOrders.data, action.order],
          },
        };
      } else {
        return {
          ...state,
          transaction: {
            transactionType: "Fill Order",
            isPending: false,
            isSuccessful: true,
            isError: false,
          },
          filledOrders: {
            ...state.filledOrders,
            data,
          },
        };
      }
    //----------------------------------
    // GIVEAWAY REQUESTS
    case "GIVEAWAY_REQUEST":
      return {
        ...state,
        transaction: {
          transactionType: "Giveaway",
          isPending: true,
          isSuccessful: false,
          isError: false,
        },
      };
    case "GIVEAWAY_SUCCESS":
      return {
        ...state,
        transaction: {
          transactionType: "Giveaway",
          isPending: false,
          isSuccessful: true,
          isError: false,
        },
        events: [action.event, ...state.events],
      };
    case "GIVEAWAY_FAIL":
      return {
        ...state,
        contractErrorMessage: action.contractErrorMessage,
        transaction: {
          transactionType: "Giveaway",
          isPending: false,
          isSuccessful: false,
          isError: true,
        },
      };
    case "GIVEAWAY_COMPLETE":
      return {
        ...state,
        contractErrorMessage: "",
        transaction: {
          transactionType: "",
          isPending: false,
          isSuccessful: false,
          isError: false,
        },
      };
    default:
      return state;
  }
};

const DEFAULT_GIVEAWAY_STATE = {
  contract: null,
  available: true,
};
export const giveAway = (state = DEFAULT_GIVEAWAY_STATE, action) => {
  switch (action.type) {
    case "GIVEAWAY_CONTRACT_LOADED":
      return {
        ...state,
        contract: action.contract,
      };
    case "GIVEAWAY_INFO_LOADED":
      return {
        ...state,
        available: action.available,
      };
    case "FAUCET_LINK_LOADED":
      return {
        ...state,
        faucet: action.faucet,
      };
    default:
      return state;
  }
};
