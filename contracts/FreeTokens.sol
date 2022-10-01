// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

// This contract has the purpose to control
// how free tokens are distributed to the exchange's users
// 1. Deployer can withdraw or deposit tokens at any moment
// 2. Users can get free tokens from this contract
// 3. 24h lockout after receiving tokens

contract FreeTokens {
    address public deployer;

    address public token1;
    address public token2;
    address public token3;

    uint256 private constant A_DAY = 24 * 60 * 60;

    // Balance of this token for a specific token
    mapping(address => uint256) public balanceOf;

    // Timestamps for each token per user
    // @dev: lastTransfer [_user] -> returns timestamp
    mapping(address => uint256) public lastTransfer;

    event Donation(uint256 amount, address user);

    constructor(
        address _deployer,
        address _token1,
        address _token2,
        address _token3
    ) {
        deployer = _deployer;
        token1 = _token1;
        token2 = _token2;
        token3 = _token3;
    }

    // ----------------------------------------------------
    // DEPLOYER ONLY FUNCTIONS
    function depositToken(address _token, uint256 _amount) public {
        require(msg.sender == deployer);
        // Below requires allowance!
        // @dev: approve() Token.sol method
        require(
            Token(_token).transferFrom(msg.sender, address(this), _amount),
            "Transfer to contract not completed"
        );

        balanceOf[_token] = balanceOf[_token] + _amount;
    }

    function withdrawToken(address _token, uint256 _amount) public {
        require(msg.sender == deployer);
        require(_amount <= balanceOf[_token], "Insufficient balance");
        require(
            Token(_token).transfer(deployer, _amount),
            "Transfer to deployer not completed"
        );

        balanceOf[_token] = balanceOf[_token] - _amount;
    }

    // ----------------------------------------------------
    // TRANSFERING TOKENS TO USERS
    function transferToUser(uint256 _amount) public {
        // Checking for the 24hours cooldown
        require(
            transferIsAvailable(lastTransfer[msg.sender]),
            "Wait 24 hours before the next transfer."
        );
        require(
            _amount <= balanceOf[token1] &&
                _amount <= balanceOf[token2] &&
                _amount <= balanceOf[token3],
            "Insufficient contract balance"
        );

        // Transfering funds to user
        // Token1...
        require(
            Token(token1).transfer(msg.sender, _amount),
            "[Token1]: Transfer to user not completed"
        );
        // Token2...
        require(
            Token(token2).transfer(msg.sender, _amount),
            "[Token2]: Transfer to user not completed"
        );
        // Token3...
        require(
            Token(token3).transfer(msg.sender, _amount),
            "[Token3]: Transfer to user not completed"
        );

        // Updating the contract's balance
        balanceOf[token1] = balanceOf[token1] - _amount;
        balanceOf[token2] = balanceOf[token2] - _amount;
        balanceOf[token3] = balanceOf[token3] - _amount;

        // Updating the timestamp mapping
        lastTransfer[msg.sender] = block.timestamp;

        // Emitting event
        emit Donation(_amount, msg.sender);
    }

    function transferIsAvailable(uint256 _lastTransfer)
        internal
        returns (bool)
    {
        return ((block.timestamp - _lastTransfer) >= A_DAY);
    }
}
