// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '../interfaces/FlashLoanReceiverBase.sol';

contract AaveFlashloan is FlashLoanReceiverBase {

    using SafeMath for uint;

    struct Data {
        address token;
        uint amount;
    }

    event Log(string message, uint value);
    event LogAsset(string message, address token);

    constructor(ILendingPoolAddressesProvider _addressProvider) 
        FlashLoanReceiverBase(_addressProvider) {}

    function flashLoan(address _token, uint _amount) external {
        uint token_balance = IERC20(_token).balanceOf(address(this));
        require(token_balance > _amount, 'token balance has to be higher that the amount borrowed');

        address receiverAddress = address(this);

        // multiple assets can be borrowed, in this case just 1
        address[] memory assets = new address[](1);
        assets[0] = _token;
        
        // array of amount has to be the same lenght as the assets array
        uint[] memory amounts = new uint[](1);
        amounts[0] = _amount;
        
        // 0 = no debt (flashloan), 1 = stable and 2 = variable
        uint[] memory modes = new uint[](1);
        modes[0] = 0;

        require(assets.length == amounts.length, 'assets and amounts arrays are not the same length');

        // this is the address that would receive the debt in case modes 1 and 2
        address onBehalfOf = address(this);

        // data that can be usefull to do arbitrage or liquidations
        bytes memory params = abi.encode(Data({token: _token, amount: _amount}));

        uint16 referralCode = 0;

        // LENDING_POOL is called inside FlashLoanReceiverBase
        LENDING_POOL.flashLoan(receiverAddress, assets, amounts, modes, onBehalfOf, params, referralCode);
    }

    // AAVE protocol will call this function after we call LENDING_POOL.flashLoan()
    // here the flashloan is received, in this function we have to repay AAVE after doing stuff with the flashloan
    function executeOperation(
        address[] calldata assets, 
        uint[] calldata amounts, 
        uint[] calldata premiums, 
        address initiator, 
        bytes calldata params
        ) 
            external
            override
            returns (bool) {
                require(initiator == address(this), '!initiator');

                Data memory data_decoded = abi.decode(params, (Data));

                if(assets.length == 1) {
                    address tokenBorrowed = assets[0];
                    uint amountBorrowed = amounts[0];
                    uint fee = premiums[0];

                    require(tokenBorrowed == data_decoded.token && amountBorrowed == data_decoded.amount);

                    /* 
                     *  arbitrage or liquidation code
                     */

                    emit LogAsset('token', tokenBorrowed);
                    emit Log('borrowed', amountBorrowed);
                    emit Log('fee', fee);
                    emit Log('amount to pay back', amountBorrowed.add(fee));

                    // amoun to pay back to AAVE
                    uint totalAmount = amountBorrowed.add(fee);
                    // approve LENDING_POOL
                    IERC20(tokenBorrowed).approve(address(LENDING_POOL), totalAmount);

                } else {
                    // if you borrow more than 1 token 
                    for(uint i = 0; i < assets.length; i++){
                        emit LogAsset('token', assets[i]);
                        emit Log('borrowed', amounts[i]);
                        emit Log('fee', premiums[i]);
                    }
                }  
                return true;
            }
    
}