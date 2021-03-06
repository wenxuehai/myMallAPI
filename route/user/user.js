const express = require('express');
const usersApp = express.Router();
const queryProm = require('../../util/queryProm')
const bodyParser = require('body-parser');
const Util = require('../../util/util')
const ordersRoute = require('./orders/orders')
const addressRoute = require('./address/address')
const fs = require('fs');

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
  } else {
    let url = req.url;
    if(url.indexOf('?') !=-1){  //如果是get请求的话，url后面有参数，需将参数去掉
      url = url.replace(/\?.*/g,'')
    }
    let urlArr = ['/userInfo', '/address']
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

usersApp.use('/orders', ordersRoute)
usersApp.use('/address', addressRoute)

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
    let token = Util.setToken({ username: req.body.username }, 10*60*60); //秒为单位
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
    data: outputData
  }).end();
})

//注册接口
usersApp.post('/register', async (req, res) => {
  let body = req.body;
  let userArr = await queryProm(`select username from user where username='${body.username}'`);
  if (userArr.length != 0) {
    res.send({
      resultCode: 0,
      resultMsg: "用户名已存在"
    }).end();
  } else {
    await queryProm(`insert into user (username,password) values ('${body.username}','${body.password}')`)
    res.send({
      resultCode: 0,
      resultMsg: "注册成功"
    }).end();
  }
})

//退出登录接口
usersApp.post('/logout', async (req, res) => {
  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: { ok: true }
  }).end();
})

//获取用户个人信息接口
usersApp.get('/userInfo', async (req, res) => {
  console.log('获取用户个人信息token值有效');
  let username = req.query.userId;
  let data = await queryProm(`select username,photo_url,sex,birthday from user where username='${username}'`)
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
  let data = req.body, personalInfo = data.personalInfo;
  await queryProm(`update user set username='${personalInfo.username}',sex='${personalInfo.sex}',birthday='${personalInfo.birthday}',photo_url='${personalInfo.photo_url}' where username='${data.id}'`)
  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: { msg: '修改成功' }
  }).end();
})

//上传用户头像接口
usersApp.post('/userInfo/:userId/img', async (req, res) => {
  let file = req.files[0];

  let ext = file.originalname.split('.')[1] //文件扩展名
  let newPath = file.path + '.' + ext, oldPath = file.path;
  fs.rename(oldPath,newPath,async (err) => {
    if (err) {
      res.send({
        resultCode: 0,
        resultMsg: "success",
        data: { msg: '上传失败' }
      }).end();
    }else {
      //宿舍WiFi  切换以后必须也得重新上传图片，图片地址才修改
      let newUrl = 'http://192.168.199.223:8888/' + file.filename  + '.' + ext;
      //手机热点
      // let newUrl = 'http://192.168.43.20:8888/' + file.filename + '.' + ext;
      await queryProm(`update user set photo_url='${newUrl}' where username='${req.params.userId}'`)
      res.send({
        resultCode: 0,
        resultMsg: "success",
        data: { url: newUrl }
      }).end();
    }
  })
})

module.exports = usersApp;