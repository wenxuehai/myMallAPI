const express = require('express');
const usersApp = express.Router();
const queryProm = require('../../util/queryProm')
const bodyParser = require('body-parser');
const Util = require('../../util/util')
const ordersRoute = require('./orders/orders')

usersApp.use(bodyParser.urlencoded({ extended: false }))
usersApp.use(bodyParser.json())

// 用户订单接口在orders路由完成
usersApp.use('/orders', ordersRoute)

//登录接口
usersApp.post('/login', async (req, res) => {

  let dataArr = await queryProm(`select username,password from user where username='${req.body.username}'`);
  let outputData = {
    code: '-1',// -1 表示登录失败，其他的表示成功
    resultMsg: '',
    userAccessVo: null,
    accessToken: ''
  }

  if (dataArr.length == 0) {
    outputData = {
      code: '-1',// -1 表示登录失败，其他的表示成功
      resultMsg: '用户不存在'
    }
  } else if (Util.rstr2b64(dataArr[0].password) != req.body.password) {
    outputData = {
      code: '-1',// -1 表示登录失败，其他的表示成功
      resultMsg: '密码错误'
    }
  } else {
    let token = Util.setToken({ username: req.body.username }, 1*60*60);
    outputData = {
      code: '1',// -1 表示登录失败，其他的表示成功
      resultMsg: '登录成功',
      userAccessVo: { userId: dataArr[0].username },
      accessToken: token
    }
  }

  res.send({
    resultCode: 0,
    resultMsg: "success",
    pageNum: 1,
    pages: 1,
    data: outputData
  }).end();
})

//获取购物车数据接口
// usersApp.get('/orders/carts/items',async (req,res)=>{
//   console.log(req.get("auth"));
//   var decode = null
//   try{
//     decode = await Util.analyToken(req.get("auth"))
//     console.log(decode);
//   }catch(err){
//     console.log('已过期或者无效的token:',err.name);
//   }
//   res.send({
//     resultCode: 0,
//     resultMsg: "success",
//     data: {ok: true}
//   }).end();
// })

//获取用户个人信息接口
usersApp.get('/userInfo', async (req, res) => {
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
  console.log('获取用户个人信息token值有效，用户名：', username);
  let data = await queryProm(`select username,photo_url,sex,birthday from userInfo where username='${username}'`)
  data = data[0]
  outputData = {
    personalInfo: data
  }
  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: outputData
  }).end();
})

module.exports = usersApp;