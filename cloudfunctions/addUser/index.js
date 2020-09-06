// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    const db = cloud.database();

    const userInfo = {
        openid: wxContext.OPENID,
        ...event
    };
    return db.collection('user').add({
        data: userInfo
    }).then(res => userInfo)
}