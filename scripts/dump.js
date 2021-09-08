const Awards = require('./awards.json');
const fs = require('fs');

let awards = Awards.filter(award => award.hasAwarded === false);
fs.writeFileSync('./airdrop-list.json', JSON.stringify(awards, null, 4), { encoding: "utf-8", flag:'w'});

