const express = require('express');
const ordersApp = express.Router();
const bodyParser = require('body-parser');
const Util = require('../../../util/util')
const queryProm = require('../../../util/queryProm');
const cartsApp = require('./carts/carts')

ordersApp.use(bodyParser.urlencoded({ extended: false }))
ordersApp.use(bodyParser.json())

//购物车接口路由
ordersApp.use('/carts', cartsApp)

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
    let urlArr = ['/', '/order']
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

//获取订单各种类型订单数量的接口（还需修改）
ordersApp.get('/', async (req, res) => {
  console.log('获取用户订单数量token值有效');
  let userId = req.query.user_id;
  let data = {}
  
  data.unPayOrder = await queryProm(`select count(*) as unPayOrder from orderList where userId=${userId} and status=${1}`)
  data.unDeliveryOrder = await queryProm(`select count(*) as unDeliveryOrder from orderList where userId=${userId} and status=${4}`)
  data.unReceivedOrder = await queryProm(`select count(*) as unReceivedOrder from orderList where userId=${userId} and status=${41}`)
  data.unPayOrder = data.unPayOrder[0].unPayOrder;
  data.unDeliveryOrder = data.unDeliveryOrder[0].unDeliveryOrder;
  data.unReceivedOrder = data.unReceivedOrder[0].unReceivedOrder;

  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: data
  }).end();
})

//获取订单接口
ordersApp.get('/orderList', async (req, res) => {
  let status = req.query.status, userId = req.query.userId;
  let outputData = []
  switch (status) {
    case '0':
      await getOrderList(0);
      break;
    case '1':
      await getOrderList(1);
      break;
    case '4':
      await getOrderList(4);
      break;
    case '41':
      await getOrderList(41);
      break;
    case '5':
      await getOrderList(5);
      break;
    case '6':
      await getOrderList(6);
      break;
  }

  async function getOrderList(status) {
    let orderArr = null
    if (status == 0) {
      orderArr = await queryProm(`select orderNo,status,payAmount,totalAmount,id,parentId,totalItemNum from orderList where userId=${userId}`)
    } else {
      orderArr = await queryProm(`select orderNo,status,payAmount,totalAmount,id,parentId,totalItemNum from orderList where userId=${userId} and status=${status}`)
    }
    //得到父对象的orderEo属性数据
    for (let [index, obj] of orderArr.entries()) {
      outputData[index] = {}
      outputData[index].orderEo = obj
    }
    //得到父对象的itemList属性的值
    for (let [index, obj] of orderArr.entries()) {
      let itemList = await queryProm(`select itemId,itemNum,proName from orderdetail where orderNo=${obj.orderNo}`)
      for (let [index2, obj2] of itemList.entries()) {
        let otherInfoArr = await queryProm(`select name,sellPrice,mainPic from allgoods where itemId=${obj2.itemId}`)
        obj2.itemName = otherInfoArr[0].name;
        obj2.itemPrice = otherInfoArr[0].sellPrice;
        obj2.mainPic = otherInfoArr[0].mainPic;
      }
      outputData[index].itemList = itemList
    }
  }


  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: outputData
  }).end();
})

/* 
  提交订单的接口，此时的订单在数据库的状态应该是未支付的，status为 1
  订单状态：1--待支付  4--待发货 41--待收货 5--已签收 6--已完成 
*/
ordersApp.post('/order', async (req, res) => {
  console.log('提交订单token值有效');
  let body = req.body, order = req.body.order, itemList = req.body.itemList, address = req.body.address;
  let totalItemNum = 0
  for (const obj of itemList) {
    totalItemNum += obj.itemNum
  }
  //将数据插入订单表格
  await queryProm(`insert into orderList (userId,status,payAmount,totalAmount,id,totalItemNum) values (${body.userId},1,${order.payAmount},${order.totalAmount},${address.id},${totalItemNum})`)
  let insertArr = await queryProm(`SELECT @@IDENTITY as orderNo`);
  let orderNo = insertArr[0].orderNo
  console.log('新插入的订单的编号', orderNo);

  for (const obj of itemList) {
    //将订单详情插入订单详情表
    await queryProm(`insert into orderDetail (orderNo,itemId,itemNum,proName) values (${orderNo},${obj.itemId},'${obj.itemNum}','${obj.propValue}')`)
  }

  let outputData = await queryProm(`select orderNo,payAmount from orderList where orderNo=${orderNo}`)
  outputData = outputData[0];
  outputData.isPay = 0;

  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: outputData
  }).end();
})

//支付接口，将订单状态改为 4
ordersApp.post('/order/pay', async (req, res) => {
  let body = req.body;
  await queryProm(`update orderList set status=4 where orderNo=${body.orderNo}`)
  let outputData = {
    payId: body.orderNo,
    isPay: 1
  }

  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: outputData
  }).end();
})

module.exports = ordersApp;