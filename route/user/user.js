const express = require('express');
const usersApp = express.Router();
const queryProm = require('../../util/queryProm')
const bodyParser = require('body-parser');
const Util = require('../../util/util')

usersApp.use(bodyParser.urlencoded({ extended: false }))
usersApp.use(bodyParser.json())

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
    outputData.code = '-1';
    outputData.resultMsg = '用户不存在'
  } else if (Util.rstr2b64(dataArr[0].password) != req.body.password) {
    outputData.code = '-1';
    outputData.resultMsg = '密码错误'
  } else {
    outputData.code = '1';
    outputData.resultMsg = '登录成功';
    outputData.userAccessVo = { userId: dataArr[0].username };
    let token = Util.setToken({ username: req.body.username }, 10);
    outputData.accessToken = token;
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
usersApp.get('/orders/carts/items',async (req,res)=>{
  console.log(req.get("auth"));
  var decode = null
  try{
    decode = await Util.getToken(req.get("auth"))
    console.log(decode);
  }catch(err){
    console.log('已过期或者无效的token',err.name);
  }
  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: {ok: true}
  }).end();
})

module.exports = usersApp;