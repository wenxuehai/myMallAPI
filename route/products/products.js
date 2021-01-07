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
  pool.query(`select mainPic,name,sellPrice,saleProps,itemId from allGoods where keyword like '%${req.query.itemName}%'`, function (err, data) {
    res.send({
      resultCode: 0,
      resultMsg: "success",
      list: data
    }).end()
  })
})

//分类商品列表展示接口
productsApp.get('/catalog',async function (req, res) {
  let query = req.query,data = null;
  switch(query.type){
    case '3':
      data = await queryProm(`select * from allGoods where catalogId like '%${req.query.catalogId}%' order by sellPrice desc`);
      break;
    case '4':
      data = await queryProm(`select * from allGoods where catalogId like '%${req.query.catalogId}%' order by sellPrice`);
      break;
    default:
      data = await queryProm(`select * from allGoods where catalogId like '%${req.query.catalogId}%'`)
  }
  // let data = await queryProm(`select * from allGoods where catalogId like '%${req.query.catalogId}%'`)
  res.send({
    resultCode: 0,
    resultMsg: "success",
    list: data
  }).end()
})

//判断商品是否存在
productsApp.get('/hasThegood', async function (req, res) {
  let itemId = req.query.itemId;
  console.log('商品id：', itemId);
  let data = await queryProm(`select name,shopId from allgoods where itemId='${itemId}'`);
  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: data
  }).end()
})

//商品详情接口
productsApp.get('/goodDetails/:itemId', async (req, res) => {
  let shopId = 0, itemId = req.params.itemId, outputData = {}

  let parentArr = await queryProm(`select itemId as id,name,shopId from allgoods where itemId=${itemId}`)
  //这里是父级对象itemEo的数据
  outputData.itemEo = parentArr[0];
  shopId = parentArr[0].shopId

  //这里是查询出来的父级对象的shopEo的数据
  let shopEoData = await queryProm(`select deliveryType,deliveryTimeDesc,refundDesc,logo,name from shopDetail where shopId=${shopId}`);
  outputData.shopEo = shopEoData[0];

  //这里是父级对象的itemSkuDtos的数据
  let itemSkuData = await queryProm(`select sellPrice,shopId as id from allgoods where itemId=${itemId} and shopId=${shopId}`);

  //这里是父级对象的itemSkuDtos里的itemPropEos的数据
  let itemPropEos = await queryProm(`select propValue from allgoods where itemId=${itemId} and shopId=${shopId}`);
  itemSkuData[0].itemPropEos = itemPropEos

  //这里是父级对象itemSkuDtos里的mediaEos的数据
  let mediaData = await queryProm(`select fileUrl from media where itemId=${itemId}`)
  itemSkuData[0].mediaEos = mediaData

  outputData.itemSkuDtos = itemSkuData

  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: outputData
  }).end();
})

module.exports = productsApp;