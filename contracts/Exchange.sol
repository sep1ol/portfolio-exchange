// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;

    constructor (address _feeAccount, uint256 _feePercent){
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    //deposit tokens
    //withdraw tokens
    //check balance
    //make orders
    //cancel orders
    //fill orders
    //charge fees
    //track fee account
}
