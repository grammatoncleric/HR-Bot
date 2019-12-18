var crypto = require('crypto');
var password = '1234';

console.log(crypto.createHash('md5').update(password).digest('hex'));