const express = require('express');
const productsApp = express.Router();
const mysql = require('mysql')

var pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "mymall_db"
})

//精选好物接口、
productsApp.get('/', function (req, res) {
  pool.query("select * from goodShop", function (err, data) {
    console.log(data);
    console.log(typeof data);
    res.send({
      resultCode: 0,
      resultMsg: "success",
      list: data
    }).end();

  })
})

module.exports = productsApp;