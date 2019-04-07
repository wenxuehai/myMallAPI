const express = require('express')
const productsRoute = require('./route/products/index')

const app = express();
app.listen(8888);

app.all("*", function (req, res, next) {
  //设置允许跨域的域名，*代表允许任意域名跨域
  res.header("Access-Control-Allow-Origin", "*");
  //允许自定义的header类型
  res.header("Access-Control-Allow-Headers", "content-type, auth, Application-Key");
  //跨域允许的请求方式 
  res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");

  // if (req.method.toLowerCase() == 'options')
  //   res.send(200); //让options尝试请求快速结束
  // else
    next();
})

app.use('/products', productsRoute)