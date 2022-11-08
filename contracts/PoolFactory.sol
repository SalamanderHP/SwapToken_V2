// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../contracts/SwapToken.sol";

contract PoolFactory is Initializable, AccessControlUpgradeable {
  event SwapContractCreate(address swapContractAddress, address contractOwner, address token1Address, address token2Address);

  address[] pools;
  address owner;

  mapping(address => address[]) poolOwner;

  function initialize() external initializer {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    owner = msg.sender;
  }

  function getOwner() external view returns(address) {
    return owner;
  }

  function createPool(
    uint256 _pool_id,
    address _tokenAAddress,
    address _tokenBAddress
  ) external returns (address) {
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
      _tokenBAddress
    );

    pools.push(swapContractAddress);
    poolOwner[msg.sender].push(swapContractAddress);
    emit SwapContractCreate(swapContractAddress, msg.sender, _tokenAAddress, _tokenBAddress);
    return swapContractAddress;
  }

  function initializable() public onlyInitializing {

  }

  function getPoolOwner() public view returns (address[] memory) {
    return poolOwner[msg.sender];
  }
}
