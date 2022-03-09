// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract SwapTokenV2 is OwnableUpgradeable {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  struct Rate {
    uint256 rate;
    uint32 decimals;
  }

  mapping(address => mapping(address => Rate)) public tokenRate;

  event RateChange(address tokenIn, address tokenOut, uint256 _newRate, uint32 newRateDecimals);
  event Swap(address _tokenIn, address _tokenOut, uint256 _amountIn, uint256 _amountOut);

  function initialize() public initializer {
    __Ownable_init();
  }

  receive() external payable {}

  // function changeRate(address _tokenIn, address _tokenOut, uint256 _exchangeRate, uint32 _exchangeRateDecimals) external onlyOwner {
  //   require(_exchangeRate > 0, "The rate between token and crypto must be greater than 0");

  //   tokenRate[_tokenIn][_tokenOut].rate = _exchangeRate;
  //   tokenRate[_tokenIn][_tokenOut].decimals = _exchangeRateDecimals;

  //   emit RateChange(_tokenIn, _tokenOut, _exchangeRate, _exchangeRateDecimals);
  // }

  function swap(address _tokenIn, address _tokenOut, uint256 _amountIn) external payable {
    require(_tokenIn != _tokenOut, "Cannot transfer 2 token with same address");
    require(tokenRate[_tokenIn][_tokenOut].rate > 0, "The rate between this 2 tokens is unavailable");

    uint256 amountIn = msg.value;
    uint256 amountOut;

    if (_tokenIn != address(0)) {
      amountIn = _amountIn;
    }
    amountOut = amountIn * tokenRate[_tokenIn][_tokenOut].rate / (10 ** tokenRate[_tokenIn][_tokenOut].decimals);

    _tokenSwap(_tokenIn, _tokenOut, amountIn, amountOut);
  }

  function _tokenSwap(address _tokenIn, address _tokenOut, uint256 _amountIn, uint256 _amounOut) internal {
    require(_amountIn > 0, "Cannot swap token if token amount is equal to 0");

    _handleTokenIn(_tokenIn, msg.sender, _amountIn);
    _handleTokenOut(_tokenOut, msg.sender, _amounOut);

    emit Swap(_tokenIn, _tokenOut, _amountIn, _amounOut);
  }

  function _handleTokenIn(address _tokenIn, address _sender, uint256 _amountIn) private {
    IERC20Upgradeable token = IERC20Upgradeable(_tokenIn);

    if (_tokenIn != address(0)) { // swap token for token
      token.safeTransferFrom(_sender, address(this), _amountIn);
    }
  }

  function _handleTokenOut(address _tokenOut, address _receiver, uint256 _amountOut) private {
    IERC20Upgradeable token = IERC20Upgradeable(_tokenOut);

    if (_tokenOut == address(0)) { // swap token for native token
      (bool sent, ) = _receiver.call{value: _amountOut}("");
      require(sent, "Transfer token failed");
      return;
    }

    // swap token for token
    token.safeTransfer(_receiver, _amountOut);
  }
}
