// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../contracts/SwapToken.sol";

contract PoolFactory is Initializable {
  event SwapContractCreate(address swapContractAddress, address contractOwner, address token1Address, address token2Address);

  address[] swapContracts;

  mapping(address => address[]) poolOwner;

  function initializable() public onlyInitializing {

  }

  function createPool(
    address _tokenAAddress,
    string memory _tokenAName,
    string memory _tokenASymbol,
    address _tokenBAddress,
    string memory _tokenBName,
    string memory _tokenBSymbol,
    uint256 _salt
  ) public {
    address payable swapContractAddress;
    bytes memory bytecode = type(SwapToken).creationCode;

    assembly {
      swapContractAddress := create2(
        0,
        add(bytecode, 0x20),
        mload(bytecode),
        _salt
      )
    }

    SwapToken(swapContractAddress).initialize(
      _tokenAAddress,
      _tokenAName,
      _tokenASymbol,
      _tokenBAddress,
      _tokenBName,
      _tokenBSymbol
    );

    swapContracts.push(swapContractAddress);
    poolOwner[msg.sender].push(swapContractAddress);
    emit SwapContractCreate(swapContractAddress, msg.sender, _tokenAAddress, _tokenBAddress);
  }
}
