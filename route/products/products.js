const express = require('express');
const productsApp = express.Router();
const mysql = require('mysql');
const categoryRoute = require('./category/category')
const queryProm = require('../../util/queryProm')

var pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "mymall_db"
})
//分类的接口
productsApp.use('/category', categoryRoute)

//精选好物接口
productsApp.get('/goodItems', function (req, res) {
  pool.query("select mainPic,name,itemId,sellPrice,shopId from allgoods where goodItems=1", function (err, data) {
    res.send({
      resultCode: 0,
      resultMsg: "success",
      list: data
    }).end();
  })
})
//新品推荐接口
productsApp.get('/latest', function (req, res) {
  pool.query("select mainPic,name,itemId,sellPrice,shopId from allgoods where newItems=1", function (err, data) {
    res.send({
      resultCode: 0,
      resultMsg: "success",
      list: data
    }).end();
  })
})
//相关推荐接口
productsApp.get('/recommendItems', function (req, res) {
  pool.query("select mainPic,name,itemId,sellPrice,shopId from allgoods where recommendItems=1", function (err, data) {
    res.send({
      resultCode: 0,
      resultMsg: "success",
      list: data
    }).end();
  })
})

//关键字搜索接口
productsApp.get('/keyword', function (req, res) {
  pool.query(`select mainPic,name,sellPrice,saleProps from allGoods where keyword like '%${req.query.itemName}%'`, function (err, data) {
    res.send({
      resultCode: 0,
      resultMsg: "success",
      pageNum: 1,
      pages: 1,
      list: data
    }).end()
  })
})

//商品列表展示接口
productsApp.get('/catalog', function (req, res) {
  pool.query(`select * from allGoods where catalogId like '%${req.query.catalogId}%'`, function (err, data) {
    res.send({
      resultCode: 0,
      resultMsg: "success",
      pageNum: 1,
      pages: 1,
      list: data
    }).end()
  })
})

//商品详情接口
productsApp.get('/goodDetails/:itemId', async (req, res) => {
  let shopId = req.query.shopId,
    itemId = req.params.itemId,
    outputData = {}

  let parentArr = await queryProm(`select itemSkuDtos,itemEo,shopEo from goodsdetail where shopId=${shopId} and itemId=${itemId}`)
  //这里是父级对象的数据
  outputData = parentArr[0];

  //这里是查询出来的父级对象的itemEo的数据
  let itemEoData = await queryProm(`select id,name from itemEo where id=${outputData.itemEo}`);
  outputData.itemEo = itemEoData[0];
  //这里是查询出来的父级对象的shopEo的数据
  let shopEoData = await queryProm(`select deliveryType,deliveryTimeDesc,refundDesc,logo,name from shopEo where ID=${outputData.shopEo}`);
  outputData.shopEo = shopEoData[0];
  //这里是父级对象的itemSkuDtos的数据
  let itemSkuData = await queryProm(`select sellPrice,id,itemPropEos,mediaEos from itemSkuDtos where id=${outputData.itemSkuDtos}`);
  for (const obj of itemSkuData) {
    let str = obj.itemPropEos;
    obj.itemPropEos = [{
      propValue: str
    }]
    let mediaEosArr = await queryProm(`select fileUrl from mediaEos where shopId=${obj.mediaEos}`);
    obj.mediaEos = mediaEosArr
  }
  outputData.itemSkuDtos = itemSkuData

  res.send({
    resultCode: 0,
    resultMsg: "success",
    pageNum: 1,
    pages: 1,
    data: outputData
  }).end();
})

module.exports = productsApp;