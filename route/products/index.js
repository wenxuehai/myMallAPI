const express = require('express');
const productsApp = express.Router();
const mysql = require('mysql')

var pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "mymall_db"
})

//精选好物、相关推荐接口
productsApp.get('/', function (req, res) {
  pool.query("select * from goodShop", function (err, data) {
    res.send({
      resultCode: 0,
      resultMsg: "success",
      list: data
    }).end();
  })
})
//新品推荐接口
productsApp.get('/latest', function (req, res) {
  pool.query("select * from newPing", function (err, data) {
    res.send({
      resultCode: 0,
      resultMsg: "success",
      list: data
    }).end();
  })
})
//关键字搜索接口
productsApp.get('/keyword', function (req, res) {
  console.log(req.query.itemName);
  pool.query(`select mainPic,name,sellPrice,saleProps from allGoods where keyword like '%${req.query.itemName}%'`, function (err, data) {
    console.log(data);
    res.send({
      resultCode: 0,
      resultMsg: "success",
      pageNum: 1,
      pages: 1,
      list: data
    }).end()
  })
})
module.exports = productsApp;