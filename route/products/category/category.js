const express = require('express');
const categoryApp = express.Router();
const queryProm = require('../../../util/queryProm')

//分类栏数据接口
categoryApp.get('/tree/:id', async (req, res) =>{
  //得到最外层的数组数据
  let outputData = await queryProm("select label,children from category");

  for (const [index,obj] of outputData.entries()) {
    //得到每个父级对象的children对应的数组数据
    let childArr = await queryProm(`select value,label,children from categChild where cateChild_id=${obj.children}`)

    for (const [index2,obj2] of childArr.entries()) {
      //这里得到每个子级对象的children对应的数组数据
      let grandArr = await queryProm(`select label,node from cateGrandson where cateGrandson_id=${obj2.children}`)

      for (const [index3, obj3] of grandArr.entries()) {
        //这里得到node对应的数组数据，该数组只有一项，只需要拿到第一项的数据
        let nodeArr = await queryProm(`select id,imgUrl from grandson_Node where id=${obj3.node}`)
        grandArr[index3].node = nodeArr[0];
      }

      childArr[index2].children = grandArr;
    }
    outputData[index].children = childArr;
  }
  res.send({
    resultCode: 0,
    resultMsg: "success",
    data: outputData
  }).end();
})

module.exports = categoryApp;