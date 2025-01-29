// const mysql = require('mysql')
// var con  = mysql.createConnection({
//     host            : 'localhost',
//     user            : 'instafluencer_user01',
//     password        : 'X@qR.$0K}zQ~',
//     port            : 3306,
//     database        : 'instafluencer_db01',
//     // user            : 'root',
//     // password        : '',
//     // port            : 3307,
//     // database        : 'laravel',
//     // timezone        : 'utc'
// })

// module.exports.con = con

const mysql = require('mysql')
var con  = mysql.createConnection({
    // host            : 'localhost',
    // user            : 'instafluencer_user01',
    // password        : 'X@qR.$0K}zQ~',
    // port            : 3306,
    // database        : 'instafluencer_db01',
    // user            : 'root',
    // password        : '',
    // port            : 3307,
    // database        : 'laravel',
    // timezone        : 'utc',
    host: 'localhost',          // Try '127.0.0.1' if localhost doesn't work
    user: 'root',               // Change to a different user if necessary
    password: '',               // Provide password if necessary
    port: 3306,                 // Ensure this is correct
    database: 'influen_db',        // Ensure this database exists
    timezone: 'utc',
    charset: 'utf8mb4'          // Ensure connection uses utf8mb4 for emoji support
})

module.exports.con = con