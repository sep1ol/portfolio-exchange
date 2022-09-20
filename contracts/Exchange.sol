// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    uint256 public orderCount;

    // Stores balance for each token
    mapping(address => mapping(address => uint256)) public tokens;
    // Stores reserved tokens for created orders
    mapping(address => mapping(address => uint256)) public reservedTokens;

    // Stores order's informations
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

    // --------------------------------------------------------------------------
    // UTILITY FUNCTIONS

    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    function reserveToken(
        address _token,
        address _user,
        uint256 _amount
    ) private {
        tokens[_token][_user] = tokens[_token][_user] - _amount;
        reservedTokens[_token][_user] = reservedTokens[_token][_user] + _amount;
    }

    function reserveToken_cancel(
        address _token,
        address _user,
        uint256 _amount
    ) private {
        reservedTokens[_token][_user] = reservedTokens[_token][_user] - _amount;
    }

    function reservedTokenBalance(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return reservedTokens[_token][_user];
    }

    // --------------------------------------------------------------------------
    // TOKENS (Deposit & Withdraw)
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
        // Verifying if the user has enough to withdraw
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

    // --------------------------------------------------------------------------
    // ORDERS (Create & Cancel & Fill)
    function makeOrder(
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive
    ) public {
        require(
            amountGive <= balanceOf(tokenGive, msg.sender),
            "Insufficient balance for creating order"
        );

        require(
            balanceOf(tokenGive, msg.sender) >= 0,
            "No balance available to create an order"
        );

        orderCount++;
        reserveToken(tokenGive, msg.sender, amountGive);

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

        // Order must belong to user who created it
        require(
            address(_order.user) == msg.sender,
            "Unauthorized to cancel order"
        );
        // Order must exist
        require(_order.id == _id, "Unexisting ID");

        // Updating cancelled orders mapping
        orderCancelled[_id] = true;

        // Unreserving tokens: remove from reserved and add to balance
        reserveToken_cancel(_order.tokenGive, msg.sender, _order.amountGive);
        tokens[_order.tokenGive][msg.sender] =
            tokens[_order.tokenGive][msg.sender] +
            _order.amountGive;

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

        // Updating filled orders mapping
        orderFilled[_order.id] = true;
    }

    // --------------------------------------------------------------------------
    // TRADE FUNCTION
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
        tokens[tokenGive][msg.sender] =
            tokens[tokenGive][msg.sender] +
            amountGive;

        // Changing the balance of the user who created the order
        tokens[tokenGet][_user] = tokens[tokenGet][_user] + amountGet;

        // Cancelling reserved token
        reserveToken_cancel(tokenGive, _user, amountGive);

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
