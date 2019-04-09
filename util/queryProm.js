// 这里封装的是数据库查询的异步操作
// 使用方法示例：
// queryProm("select name from allgoods where ID=1").then()

const mysql = require('mysql');

var pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "mymall_db"
})

function queryProm(sqlStr) {
  return new Promise((resolve, reject) => {
    pool.query(sqlStr, function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

module.exports = queryProm;


