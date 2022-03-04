import React from "react";
import "./style.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleArrowRight } from '@fortawesome/free-solid-svg-icons';

const SwapForm = () => {
  return (
    <>
      <div className="swapform__wrapper">
        <div className="row form__container">
          <div className="col-5">
            <div className="token-container">
              <div className="token-select">
                <div className="upper">ETH</div>
                <div className="below">
                  <select className="form-control" name="token-in" id="">
                    <option value="">Ethereum</option>
                    <option value="">Token A</option>
                    <option value="">Token B</option>
                  </select>
                </div>
              </div>
              <div className="token-value">
                <div className="upper">You send</div>
                <div className="below">
                  <input type="number" className="form-control" placeholder="0.00" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-2 arrow-icon">
            <FontAwesomeIcon icon={faCircleArrowRight}/>
          </div>
          <div className="col-5">
            <div className="token-container">
              <div className="token-select">
                <div className="upper">TKA</div>
                <div className="below">
                  <select className="form-control" name="token-in" id="">
                    <option value="">Ethereum</option>
                    <option value="">Token A</option>
                    <option value="">Token B</option>
                  </select>
                </div>
              </div>
              <div className="token-value">
                <div className="upper">You receive</div>
                <div className="below">
                  <input type="text" className="form-control" placeholder="0.00" disabled />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="fund">
          Available funds = 10000 ETH
        </div>
        <div className="rate">
          1 ETH = 2 TKA
        </div>
        <button className="btn-primary swap-button">
          SWAP
        </button>
      </div>
    </>
  );
}

export default SwapForm;
