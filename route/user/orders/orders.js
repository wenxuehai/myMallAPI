const express = require('express');
const ordersApp = express.Router();
const bodyParser = require('body-parser');
const Util = require('../../../util/util')
const queryProm = require('../../../util/queryProm');

ordersApp.use(bodyParser.urlencoded({ extended: false }))
ordersApp.use(bodyParser.json())

//获取订单数量的接口
ordersApp.get('/', async (req, res) => {
  let decode = await Util.analyToken(req.get("auth"))
  if (!decode) {
    console.log('已过期或者无效的token');
    res.status(401).send({
      resultCode: 0,
      resultMsg: "success",
      data: outputData
    }).end();
    return;
  }
  let username = decode.username;
  console.log('获取用户订单数量token值有效，用户名：', username);
  let data = await queryProm(`select unPayOrder,unDeliveryOrder,unReceivedOrder from ordersNum where username='${username}'`)
  data = data[0]

  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: data
  }).end();
})

module.exports = ordersApp;