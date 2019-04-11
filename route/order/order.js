const express = require('express');
const ordersApp = express.Router();
const queryProm = require('../../util/queryProm')
const bodyParser = require('body-parser');
const Util = require('../../util/util')

ordersApp.use(bodyParser.urlencoded({ extended: false }))
ordersApp.use(bodyParser.json())

//获取购物车数据接口
ordersApp.get('/carts/items', async (req, res) => {
  console.log(req.get("auth"));
  var decode = null
  try {
    decode = await Util.getToken(req.get("auth"))
    console.log(decode);
  } catch (err) {
    console.log('已过期或者无效的token', err.name);
  }
  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: { ok: true }
  }).end();
})

module.exports = ordersApp;