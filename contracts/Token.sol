// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract Token is ERC20Upgradeable {
  function initialize(string memory _name, string memory _symbol, uint256 _initialSupply) external initializer {
    __ERC20_init(_name, _symbol);
    _mint(msg.sender, _initialSupply * (10 ** decimals()));
  }
}
