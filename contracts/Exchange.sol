// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    uint256 public orderCount;

    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(
        address token,
        address user,
        uint256 amount,
        uint256 balance
    );
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Trade(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address creator,
        uint256 timestamp
    );

    struct _Order {
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    //Deposit tokens
    function depositToken(address _token, uint256 _amount) public {
        // transfer tokens to exchange
        require(
            Token(_token).transferFrom(msg.sender, address(this), _amount),
            "Transfer to exchange not completed"
        );
        // update balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;
        // emit event
        emit Deposit(
            _token,
            msg.sender,
            _amount,
            balanceOf(_token, msg.sender)
        );
    }

    function withdrawToken(address _token, uint256 _amount) public {
        require(
            balanceOf(_token, msg.sender) >= _amount,
            "Insufficient balance to withdraw"
        );
        // transfer tokens to user
        require(Token(_token).transfer(msg.sender, _amount));
        // update balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;
        // emit event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function makeOrder(
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive
    ) public {
        require(
            balanceOf(tokenGive, msg.sender) >= amountGive,
            "Insufficient balance for creating order"
        );

        orderCount++;

        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            tokenGet,
            amountGet,
            tokenGive,
            amountGive,
            block.timestamp
        );

        emit Order(
            orderCount,
            msg.sender,
            tokenGet,
            amountGet,
            tokenGive,
            amountGive,
            block.timestamp
        );
    }

    function cancelOrder(uint256 _id) public {
        _Order storage _order = orders[_id];

        require(
            address(_order.user) == msg.sender,
            "Unauthorized to cancel order"
        );
        require(_order.id == _id, "Unexisting ID");

        orderCancelled[_id] = true;

        emit Cancel(
            _order.id,
            msg.sender,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive,
            block.timestamp
        );
    }

    function fillOrder(uint256 _id) public {
        require(!orderCancelled[_id], "Order has been canceled");
        require(!orderFilled[_id], "Order already filled");
        require(_id > 0 && _id <= orderCount, "Order does not exist");

        _Order storage _order = orders[_id];

        _trade(
            _order.id,
            _order.user,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive
        );

        orderFilled[_order.id] = true;
    }

    function _trade(
        uint256 _orderId,
        address _user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive
    ) internal {
        // Calculating fee paid by who is completing the order
        uint256 _feeAmount = (amountGet * feePercent) / 100;

        // Checking if who's completing the order has enough balance
        require(
            balanceOf(tokenGet, msg.sender) >= (amountGet + _feeAmount),
            "Insufficient funds to complete order"
        );

        // Charging fees
        tokens[tokenGet][feeAccount] =
            tokens[tokenGet][feeAccount] +
            _feeAmount;

        // Changing the balance of the user completing the order
        tokens[tokenGet][msg.sender] =
            tokens[tokenGet][msg.sender] -
            (amountGet + _feeAmount);
        tokens[tokenGet][_user] = tokens[tokenGet][_user] + amountGet;

        // Changing the balance of the user who created the order
        tokens[tokenGive][_user] = tokens[tokenGive][_user] - amountGive;
        tokens[tokenGive][msg.sender] =
            tokens[tokenGive][msg.sender] +
            amountGive;

        emit Trade(
            _orderId,
            msg.sender,
            tokenGet,
            amountGet,
            tokenGive,
            amountGive,
            _user,
            block.timestamp
        );
    }
}
