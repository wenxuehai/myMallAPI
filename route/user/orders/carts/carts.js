const express = require('express');
const cartsApp = express.Router();
const bodyParser = require('body-parser');
const Util = require('../../../../util/util')
const queryProm = require('../../../../util/queryProm');

cartsApp.use(bodyParser.urlencoded({ extended: false }))
cartsApp.use(bodyParser.json())

//这是解析出来的token的值
let decode = null;
// 监听所有需要验证token的请求
cartsApp.use(async function (req, res, next) {
  if (req.method.toLowerCase() == 'options') {
    res.send({
      resultCode: 0,
      resultMsg: "success"
    }).end();
  } else {
    let urlArr = ['/',  '/item']
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

//获取购物车详细数据的接口
cartsApp.get('/', async (req, res) => {
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
cartsApp.get('/num', async (req, res) => {
  let userId = req.query.userId;
  let arr = await queryProm(`select count(*) as num from userCart where userId=${userId}`)
  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: arr[0].num
  }).end();
})

//加入购物车的接口
cartsApp.post('/', async (req, res) => {
  console.log('加入购物车token值有效');
  let data = req.body.cartList[0]
  await queryProm(`insert into userCart (userId,itemId,shopId,propValue,itemNum) values (${data.userId},${data.itemId},${data.skuId},'${data.propValue}',${data.itemNum})`)
  res.send({
    resultCode: 0,
    resultMsg: "success"
  }).end();
})

module.exports = cartsApp;