const bcrypt = require('bcryptjs');

const plainPassword = 'admin';
const saltRounds = 10;

const salt = bcrypt.genSaltSync(saltRounds);
const hashedPassword = bcrypt.hashSync(plainPassword, salt);

console.log('明文密码:', plainPassword);
console.log('新的哈希密码:', hashedPassword);
console.log('验证匹配:', bcrypt.compareSync(plainPassword, hashedPassword)); // 应输出 true