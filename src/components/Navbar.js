import { useDispatch, useSelector } from "react-redux";
import logoImage from "../assets/website-logo.png";
import eth from "../assets/eth.svg";
import Blockies from "react-blockies";
import { loadAccount } from "../store/interactions";
import config from "../config.json";
import { ACCEPTED_NETWORKS } from "../store/interactions";

const Navbar = () => {
  const dispatch = useDispatch();
  const provider = useSelector((state) => state.provider.connection);
  const account = useSelector((state) => state.provider.account);
  const balance = useSelector((state) => state.provider.balance);
  const chainId = useSelector((state) => state.provider.chainId);

  const NETWORKS = [...ACCEPTED_NETWORKS];

  const connectHandler = async () => {
    await loadAccount(dispatch, provider);
  };

  const networkHandler = async (e) => {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: e.target.value }],
    });
  };

  return (
    <div className="exchange__header grid">
      <div className="exchange__header--brand flex">
        <img src={logoImage} className="logo" alt="logo" />
        <h1>Sep1ol Token Exchange</h1>
      </div>

      <div className="exchange__header--networks flex">
        <img src={eth} alt="eth logo" className="Eth Logo" />
        {chainId && (
          <select
            name="networks"
            id="networks"
            value={config[chainId] ? config[chainId].chainId_hexa : "0"}
            onChange={(e) => {
              networkHandler(e);
            }}
          >
            <option value="0" disabled>
              Select Network
            </option>
            <option value={config[NETWORKS[0]].chainId_hexa}>
              {config[NETWORKS[0]].name}
            </option>
            <option value={config[NETWORKS[1]].chainId_hexa}>
              {config[NETWORKS[1]].name}
            </option>
            {/* <option value={config[NETWORKS[2]].chainId_hexa}>
              {config[NETWORKS[2]].name}
            </option> */}
          </select>
        )}
      </div>

      <div className="exchange__header--account flex">
        {balance ? (
          <p>
            <small>My balance</small>
            {Number(balance).toFixed(4)} ETH
          </p>
        ) : (
          <p>
            <small>My balance</small>0 ETH
          </p>
        )}
        {account ? (
          <a
            href={
              config[chainId]
                ? `${config[chainId].explorerURL}/address/${account}`
                : "#"
            }
            target="_blank"
            rel="noreferrer"
          >
            {account.slice(0, 5) + "..." + account.slice(38, 42)}{" "}
            <Blockies
              seed={account}
              size={10}
              scale={3}
              className="identicon"
            />
          </a>
        ) : (
          <button className="button" onClick={connectHandler}>
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;

// "31337": {
//   "name": "Localhost",
//   "chainId_hexa": "0x7A69",
//   "explorerURL": "#",
//   "faucet": "",
//   "giveawayContract": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
//   "exchange":{
//       "address": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
//   },
//   "sep1ol":{
//       "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
//   },
//   "mETH":{
//       "address": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
//   },
//   "mUSDT":{
//       "address": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
//   }
// },
