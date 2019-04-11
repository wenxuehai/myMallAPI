const express = require('express');
const usersApp = express.Router();
const queryProm = require('../../util/queryProm')
const bodyParser = require('body-parser');
const Util = require('../../util/util')
const ordersRoute = require('./orders/orders')

usersApp.use(bodyParser.urlencoded({ extended: false }))
usersApp.use(bodyParser.json())

//这是解析出来的token的值
let decode = null;
// 监听所有需要验证token的请求
usersApp.use(async function (req, res, next) {
  if (req.method.toLowerCase() == 'options') {
    res.send({
      resultCode: 0,
      resultMsg: "success"
    }).end();
  }else{
    let urlArr = ['/userInfo']
    if (urlArr.indexOf(req.url) != -1) { //请求地址存在于上面的数组中，则需要验证token值
      decode = await Util.analyToken(req.get("auth"))
      if (!decode) {  //如果token过期
        console.log('已过期或者无效的token');
        res.status(401).send({}).end();
        return;
      }
      next();
    }else{ //如果不需要验证token，直接next
      next();
    }
  }
})

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
    let token = Util.setToken({ username: req.body.username }, 10*60*60);
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
  let username = req.query.userId;
  console.log('获取用户个人信息token值有效');
  let data = await queryProm(`select username,photo_url,sex,birthday from userInfo where username='${username}'`)
  console.log(data);
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

//修改用户个人信息接口
usersApp.put('/userInfo', async (req, res) => {
  let username = decode.username;
  console.log('修改用户个人信息token值有效，用户名：', username);

  console.log(req.body);
  let data = req.body,personalInfo=data.personalInfo;
  await queryProm(`update userInfo set username='${personalInfo.username}',sex='${personalInfo.sex}',birthday='${personalInfo.birthday}',photo_url='${personalInfo.photo_url}' where username='${data.id}'`)
  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: {msg: '修改成功'}
  }).end();
})

module.exports = usersApp;