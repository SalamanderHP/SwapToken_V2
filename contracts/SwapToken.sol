// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

interface IPoolFactory {
  function getOwner() external view returns(address);
}

contract SwapToken is AccessControlUpgradeable {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  address public factory;

  struct Rate {
    uint256 rate;
    uint32 decimals;
  }

  struct Token {
    address tokenAddress;
    uint256 amount;
    string name;
    string symbol;
  }

  uint256 public rate;
  Token public tokenA;
  Token public tokenB;

  mapping(address => mapping(address => Rate)) public tokenRate;
  mapping(address => Token) public poolToken;

  event RateChange(address tokenIn, address tokenOut, uint256 _newRate, uint32 newRateDecimals);
  event Swap(address _tokenIn, address _tokenOut, uint256 _amountIn, uint256 _amountOut);
  event Deposit(address tokenAddress, uint256 amount, address sender);

  constructor() payable {
    factory = msg.sender;
  }

  function initialize(
    address _tokenAAddress,
    address _tokenBAddress
  ) public initializer {
    require(msg.sender == factory, "UNAUTHORIZED: Caller is not factory contract");

    ERC20Upgradeable tokenAInstance = ERC20Upgradeable(_tokenAAddress);
    ERC20Upgradeable tokenBInstance = ERC20Upgradeable(_tokenBAddress);
    tokenA = Token(_tokenAAddress, 0, tokenAInstance.name(), tokenAInstance.symbol());
    tokenB = Token(_tokenBAddress, 0, tokenBInstance.name(), tokenBInstance.symbol());
    poolToken[_tokenAAddress] = tokenA;
    poolToken[_tokenBAddress] = tokenB;
    _setupRole(DEFAULT_ADMIN_ROLE, factory);
    _setupRole(
      DEFAULT_ADMIN_ROLE,
      IPoolFactory(factory).getOwner()
    );
  }

  receive() external payable {}

  function changeRate(address _tokenIn, address _tokenOut, uint256 _exchangeRate, uint32 _exchangeRateDecimals) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_exchangeRate > 0, "The rate between token and crypto must be greater than 0");

    tokenRate[_tokenIn][_tokenOut].rate = _exchangeRate;
    tokenRate[_tokenIn][_tokenOut].decimals = _exchangeRateDecimals;

    emit RateChange(_tokenIn, _tokenOut, _exchangeRate, _exchangeRateDecimals);
  }

  function deposit(address _tokenAddress, uint256 _tokenAmount) external payable {
    require(_tokenAddress == tokenA.tokenAddress || _tokenAddress == tokenB.tokenAddress, "Token in is not available in this pool");

    if (_tokenAddress == address(0)) {
      require(msg.value == _tokenAmount, "Value must be greater than 0");
      _handleDepositNative(_tokenAddress, _tokenAmount);
      emit Deposit(_tokenAddress, _tokenAmount, msg.sender);
      return;
    }

    _handleDepositToken(_tokenAddress, _tokenAmount);
    emit Deposit(_tokenAddress, _tokenAmount, msg.sender);
  }

  function swap(address _tokenIn, address _tokenOut, uint256 _amountIn) external payable {
    require(_tokenIn != _tokenOut, "Cannot transfer 2 token with same address");
    require(tokenRate[_tokenIn][_tokenOut].rate > 0, "The rate between this 2 tokens is unavailable");
    require(_tokenIn == tokenA.tokenAddress || _tokenIn == tokenB.tokenAddress, "Token in is not available in this pool");
    require(_tokenOut == tokenA.tokenAddress || _tokenOut == tokenB.tokenAddress, "Token out is not available in this pool");

    uint256 amountIn = msg.value;
    uint256 amountOut;

    if (_tokenIn != address(0)) {
      amountIn = _amountIn;
    }
    amountOut = amountIn * tokenRate[_tokenIn][_tokenOut].rate / (10 ** tokenRate[_tokenIn][_tokenOut].decimals);

    _tokenSwap(_tokenIn, _tokenOut, amountIn, amountOut);
  }

  function _handleDepositNative(address _tokenAddress, uint256 _tokenAmount) internal {
    if (_tokenAddress == tokenA.tokenAddress) {
      tokenA.amount = tokenA.amount + _tokenAmount;
      return;
    }

    tokenB.amount = tokenB.amount + _tokenAmount;
  }

  function _handleDepositToken(address _tokenAddress, uint256 _tokenAmount) internal {
    IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
    token.safeTransferFrom(msg.sender, address(this), _tokenAmount);

    if (_tokenAddress == tokenA.tokenAddress) {
      tokenA.amount = tokenA.amount + _tokenAmount;
      return;
    }

    tokenB.amount = tokenB.amount + _tokenAmount;
  }

  function _tokenSwap(address _tokenIn, address _tokenOut, uint256 _amountIn, uint256 _amountOut) internal {
    require(_amountIn > 0, "Cannot swap token if token amount is equal to 0");
    require(poolToken[_tokenOut].amount > _amountOut, "The amount of token out must be greater than pool balance");

    _handleTokenIn(_tokenIn, msg.sender, _amountIn);
    _handleTokenOut(_tokenOut, msg.sender, _amountOut);

    if (_tokenIn == tokenA.tokenAddress) {
      tokenA.amount = tokenA.amount + _amountIn;
      tokenB.amount = tokenB.amount - _amountOut;
      emit Swap(_tokenIn, _tokenOut, _amountIn, _amountOut);
      return;
    }

    tokenB.amount = tokenB.amount + _amountIn;
    tokenA.amount = tokenA.amount - _amountOut;
    emit Swap(_tokenIn, _tokenOut, _amountIn, _amountOut);
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
