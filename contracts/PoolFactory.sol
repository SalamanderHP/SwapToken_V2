// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../contracts/SwapToken.sol";

contract PoolFactory is Initializable {
  event SwapContractCreate(address swapContractAddress, address contractOwner, address token1Address, address token2Address);

  address[] pools;

  mapping(address => address[]) poolOwner;

  function initializable() public onlyInitializing {

  }

  function createPool(
    uint256 _pool_id,
    address _tokenAAddress,
    string memory _tokenAName,
    string memory _tokenASymbol,
    address _tokenBAddress,
    string memory _tokenBName,
    string memory _tokenBSymbol
  ) external {
    require(msg.sender == tx.origin, "Cannot create pool from smart contract");

    address payable swapContractAddress;
    bytes memory bytecode = type(SwapToken).creationCode;
    bytes32 salt = keccak256(
      abi.encodePacked(
        msg.sender,
        _pool_id,
        block.timestamp,
        pools.length,
        _tokenAAddress,
        _tokenBAddress
      )
    );

    assembly {
      swapContractAddress := create2(
        0,
        add(bytecode, 0x20),
        mload(bytecode),
        salt
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

    pools.push(swapContractAddress);
    poolOwner[msg.sender].push(swapContractAddress);
    emit SwapContractCreate(swapContractAddress, msg.sender, _tokenAAddress, _tokenBAddress);
  }
}
