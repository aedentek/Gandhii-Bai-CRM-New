import mysql from 'mysql2/promise';


// const db = await mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_User,
//   password: process.env.DB_Password,
//   database: process.env.Database_Name,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });


const db = await mysql.createPool({
  host:'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});



// const db = await mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_User,
//   password: process.env.DB_Password,
//   database: process.env.Database_Name,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });


export default db;