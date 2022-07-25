// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
//0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

contract Token {
    string public name;
    string public symbol;
    uint256 public totalSupply;
    uint256 public decimals = 18;

    constructor( string memory _name, string memory _symbol, uint256 _totalSupply ){
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
    }
}
