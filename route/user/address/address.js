const express = require('express');
const addressApp = express.Router();
const bodyParser = require('body-parser');
const Util = require('../../../util/util')
const queryProm = require('../../../util/queryProm');

addressApp.use(bodyParser.urlencoded({ extended: false }))
addressApp.use(bodyParser.json())

//这是解析出来的token的值
let decode = null;
// 监听所有需要验证token的请求
addressApp.use(async function (req, res, next) {
  if (req.method.toLowerCase() == 'options') {
    res.send({
      resultCode: 0,
      resultMsg: "success"
    }).end();
  } else {
    let url = req.url;
    if (url.indexOf('?') != -1) {
      url = url.replace(/\?.*/g, '')
    }
    let urlArr = ['/', '/status']
    if (urlArr.indexOf(url) != -1) { //请求地址存在于上面的数组中，则需要验证token值
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

//获取收货地址接口
addressApp.get('/', async (req, res) => {
  console.log('获取用户收货地址token值有效');
  let userId = req.query.userId;
  let data = await queryProm(`select id,contact,phone,region,detailAddr,status from address where userId='${userId}'`)
  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: data
  }).end();
})

//修改用户默认收货地址接口
addressApp.put('/status', async (req, res) => {
  await queryProm(`update address set status=0 where userId='${req.body.userId}'`)
  await queryProm(`update address set status=1 where id='${req.body.itemId}'`)
  res.send({
    resultCode: 0,
    resultMsg: "success"
  }).end();
})

//修改收货地址接口
addressApp.put('/:addressId', async (req, res) => {
  let body = req.body;
  await queryProm(`update address set contact='${body.contact}',detailAddr='${body.detailAddr}',phone='${body.phone}',region='${body.region}' where id='${body.id}'`);
  res.send({
    resultCode: 0,
    resultMsg: "success"
  }).end();
})

//删除收货地址接口
addressApp.delete('/:addressId', async (req, res) => {
  let params = req.params;
  await queryProm(`delete from address where id='${params.addressId}'`);
  res.send({
    resultCode: 0,
    resultMsg: "success"
  }).end();
})

//新增收货地址接口
addressApp.post('/:userId', async (req, res) => {
  let body = req.body,params = req.params;
  await queryProm(`insert into address (userId,contact,phone,region,detailAddr,status) values ('${params.userId}','${body.contact}','${body.phone}','${body.region}','${body.detailAddr}','${body.status}')`);
  res.send({
    resultCode: 0,
    resultMsg: "success"
  }).end();
})

module.exports = addressApp;