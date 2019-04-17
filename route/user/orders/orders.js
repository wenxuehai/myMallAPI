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
    let urlArr = ['/', '/order', '/carts', '/carts/item']
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
  console.log('获取用户订单数量token值有效');
  let userId = req.query.user_id;
  let data = await queryProm(`select unPayOrder,unDeliveryOrder,unReceivedOrder from user where username='${userId}'`)
  data = data[0]

  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: data
  }).end();
})

//提交订单的接口，此时的订单在数据库里的状态应该是未支付的，status为 1
// 订单状态：1--待支付  4--待发货 41--待收货 5--已签收 6--已完成
ordersApp.post('/order', async (req, res) => {
  console.log('提交订单token值有效');
  let body = req.body, order = req.body.order, itemList = req.body.itemList, address = req.body.address;

  //将数据插入订单表格
  await queryProm(`insert into orderList (userId,status,payAmount,totalAmount,id,totalItemNum) values (${body.userId},1,${order.payAmount},${order.totalAmount},${address.id},${itemList.length})`)
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

//支付接口
ordersApp.post('/order/pay', async (req, res) => {
  let body = req.body;
  await queryProm(`update orderList set status=4 where orderNo=${body.orderNo}`)
  let outputData = {
    payId: body.orderNo,
    isPay:1
  }

  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: outputData
  }).end();
})

//获取购物车详细数据的接口
ordersApp.get('/carts', async (req, res) => {
  console.log('获取购物车数据token值有效');
  let userId = req.query.userId
  let dataArr = await queryProm(`select ID,shopId,itemId,propValue from userCart where userId=${userId}`);
  for (const obj of dataArr) {
    let nameArr = await queryProm(`select name from shopDetail where shopId=${obj.shopId}`);
    obj.shopName = nameArr[0].name;

    let itemNum = await queryProm(`select itemNum from userCart where ID=${obj.ID}`);
    obj.shopItems = [{}];
    obj.shopItems[0].itemNum = itemNum[0].itemNum;
    obj.shopItems[0].checked = false;
    obj.shopItems[0].propValue = obj.propValue;

    let itemInfoArr = await queryProm(`select mainPic as imgUrl,sellPrice,name as itemName from allgoods where itemId=${obj.itemId}`);
    Object.assign(obj.shopItems[0], itemInfoArr[0])
  }

  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: dataArr
  }).end();
})

//获取购物车数量的接口
ordersApp.get('/carts/num', async (req, res) => {
  let userId = req.query.userId;
  let arr = await queryProm(`select count(*) as num from userCart where userId=${userId}`)
  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: arr[0].num
  }).end();
})

//加入购物车的接口
ordersApp.post('/carts', async (req, res) => {
  console.log('加入购物车token值有效');
  let data = req.body.cartList[0]
  await queryProm(`insert into userCart (userId,itemId,shopId,propValue,itemNum) values (${data.userId},${data.itemId},${data.skuId},'${data.propValue}',${data.itemNum})`)
  res.send({
    resultCode: 0,
    resultMsg: "success"
  }).end();
})

module.exports = ordersApp;