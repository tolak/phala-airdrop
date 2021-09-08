// USAGE:
//  node summary.js

const BN = require('bn.js');
const Awards = require('./awards.json');

function main() {
    let total_users = 0;
    let total_awards = new BN('0');
    Awards.filter(award => award.hasAwarded === false).map(award => {
        total_awards = total_awards.add(new BN(award.amountWei));
        total_users += 1;
    });
    console.log('Total awards(wei): ', total_awards.toString());
    console.log(`Total users: ${total_users}, Total awards: ${total_awards.div(new BN('1000000000000000000'))}`);
}

main();