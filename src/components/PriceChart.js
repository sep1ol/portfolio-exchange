import Chart from "react-apexcharts";
import { useSelector } from "react-redux";

import arrowDown from "../assets/down-arrow.svg";
import arrowUp from "../assets/up-arrow.svg";

import { priceChartSelector } from "../store/selectors";
import { options } from "./PriceChart.config";

import Banner from "./Banner";

const PriceChart = () => {
  const account = useSelector((state) => state.provider.account);
  const symbols = useSelector((state) => state.tokens.symbols);
  const priceChart = useSelector(priceChartSelector);

  return (
    <div className="component exchange__chart">
      <div className="component__header flex-between">
        <div className="flex">
          {symbols && <h2>{`${symbols[0]}/${symbols[1]}`}</h2>}

          {priceChart && (
            <div className="flex">
              {priceChart.lastPriceChange === "+" ? (
                <img src={arrowUp} alt="Arrow down" />
              ) : (
                <img src={arrowDown} alt="Arrow down" />
              )}
              <span className="up">{priceChart.lastPrice}</span>
            </div>
          )}
        </div>
      </div>

      {!account ? (
        <Banner text="Please connect with Metamask" />
      ) : (
        <Chart
          type="candlestick"
          options={options}
          series={priceChart && priceChart.series}
          width="100%"
          height="100%"
        />
      )}
    </div>
  );
};

export default PriceChart;
