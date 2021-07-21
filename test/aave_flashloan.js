const IERC20 = artifacts.require('IERC20');
const AaveFlashloan = artifacts.require('AaveFlashloan');
const BN = require('bn.js');
const { assert } = require('chai');

require('dotenv').config();
require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('AaveFlashloan', accounts => {
    const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const AAVE = '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5';

    const DECIMALS = 18;
    const DAI_WHALE = process.env.DAI_WHALE;

    const FUND_AMOUNT = new BN(10).pow(new BN(DECIMALS)).mul(new BN(21000));
    const FUND_AMOUNT_FAIL = new BN(10).pow(new BN(DECIMALS)).mul(new BN(1000));
    const BORROW_AMOUNT = new BN(10).pow(new BN(DECIMALS)).mul(new BN(1000000));

    let aaveFlashloan, token, token_borrowed, flashloan_user, amount, contract_balance

    beforeEach(async() => {
        token = await IERC20.at(DAI);
        aaveFlashloan = await AaveFlashloan.new(AAVE);
        flashloan_user = accounts[0];

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [DAI_WHALE],
        });
        console.log(`contract address is: ${aaveFlashloan.address}`)

        const whale_balance = await token.balanceOf(DAI_WHALE);
        assert(whale_balance.gte(FUND_AMOUNT), 'Whale DAI balance has to be higher than FUND_AMOUNT');
    })

    it('flash loan function works correctly', async () => {

        await token.transfer(aaveFlashloan.address, FUND_AMOUNT, { from: DAI_WHALE });
        contract_balance = await token.balanceOf(aaveFlashloan.address)/1e18
        console.log(`DAI contract balance before flashloan: ${contract_balance.toString()}`)

        const tx = await aaveFlashloan.flashLoan(DAI, BORROW_AMOUNT)
        token_borrowed = await aaveFlashloan.tokenBorrowed();
        assert.equal(DAI, token_borrowed, 'token and token_borrowed are different')
        
        for(const log of tx.logs){
            //console.log(log.args.message, log.args.token)
            amount = log.args.value/1e18;
            console.log(log.args.message, amount.toString())
        }
        contract_balance = await token.balanceOf(aaveFlashloan.address)/1e18
        console.log(`DAI contract balance after flashloan: ${contract_balance.toString()}`)


    })

    it('flash loan function should fail if contract balance is less than 2% of BORROW_AMOUT', async () => {

        await token.transfer(aaveFlashloan.address, FUND_AMOUNT_FAIL, { from: DAI_WHALE });
        const contract_balance = await token.balanceOf(aaveFlashloan.address)/1e18
        console.log(`DAI contract balance: ${contract_balance.toString()} --- this is not enough balance, should be rejected `)
        await aaveFlashloan.flashLoan(DAI, BORROW_AMOUNT).should.be.rejected;
    })

})
