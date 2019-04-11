const express = require('express');
const ordersApp = express.Router();
const bodyParser = require('body-parser');
const Util = require('../../../util/util')
const queryProm = require('../../../util/queryProm');

ordersApp.use(bodyParser.urlencoded({ extended: false }))
ordersApp.use(bodyParser.json())

//这是解析出来的token的值
let decode = null;
// 监听所有需要验证token的请求
ordersApp.use(async function (req, res, next) {
  if (req.method.toLowerCase() == 'options') {
    res.send({
      resultCode: 0,
      resultMsg: "success"
    }).end();
  } else {
    let urlArr = ['/']
    if (urlArr.indexOf(req.url) != -1) { //请求地址存在于上面的数组中，则需要验证token值
      decode = await Util.analyToken(req.get("auth"))
      if (!decode) {  //如果token过期
        console.log('已过期或者无效的token');
        res.status(401).send({}).end();
        return;
      }
      next();
    } else { //如果不需要验证token，直接next
      next();
    }
  }
})

//获取订单数量的接口
ordersApp.get('/', async (req, res) => {
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