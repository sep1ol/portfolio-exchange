import { useDispatch, useSelector } from "react-redux";
import config from "../config.json";
import { loadTokens } from "../store/interactions";

const Markets = () => {
  const dispatch = useDispatch();

  const chainId = useSelector((state) => state.provider.chainId);
  const provider = useSelector((state) => state.provider.connection);

  const marketHandler = async (e) => {
    await loadTokens(
      [e.target.value.split(",")[0], e.target.value.split(",")[1]],
      provider,
      dispatch
    );
  };

  return (
    <div className="component exchange__markets">
      <div className="component__header">
        <h2>Select Market</h2>
      </div>

      {chainId && config[chainId] ? (
        <select
          name="markets"
          id="markets"
          onChange={async (e) => {
            await marketHandler(e);
          }}
        >
          <option
            value={`${config[chainId].sep1ol.address},${config[chainId].mETH.address}`}
          >
            SEPT / mETH
          </option>
          <option
            value={`${config[chainId].sep1ol.address},${config[chainId].mUSDT.address}`}
          >
            SEPT / mUSDT
          </option>
        </select>
      ) : (
        <p>Blockchain Network Error.</p>
      )}

      <hr />
    </div>
  );
};

export default Markets;
