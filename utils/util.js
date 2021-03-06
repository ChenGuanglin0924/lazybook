const config = require('./config.js');

let Util = {

  /**
   * 封装wx.request，自动添加host以及API版本号
   */
  request: (obj) => {
    const skey = wx.getStorageSync('skey');
    obj.header = Object.assign({}, obj.header, { skey });
    return wx.request(obj);
  },

  /**
   * 验证授权
   * scopeType:权限类型(userInfo/werun)
   */
  validateAuthorize: (scopeType) => {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.' + scopeType]) {
            resolve();
          } else {
            reject();
          }
        }
      })
    })
  },

  /**
   * 发起授权
   * scopeType:权限类型(userInfo/werun)
   */
  initiateAuthorize: (scopeType) => {
    return new Promise((resolve, reject) => {
      wx.authorize({
        scope: 'scope.' + scopeType,
        success(res) {
          resolve();
        },
        fail() {
          reject();
        }
      })
    })
  },

  showMessage: (text, icon, duration) => {
    wx.showToast({
      title: text,
      icon: icon || 'none',
      duration: duration || 2000
    })
  },

  hideMessage: () => {
    wx.hideToast();
  },

  showLoading: (text) => {
    wx.showLoading({
      title: text || '',
      mask: true
    })
  },

  hideLoading: () => {
    wx.hideLoading()
  },

  formatTime: (dateObj) => {
    const date = dateObj || new Date();
    let year = date.getFullYear(),
      mon = date.getMonth() + 1,
      day = date.getDate(),
      hour = date.getHours(),
      min = date.getMinutes();
    mon = mon < 10 ? `0${mon}` : mon;
    day = day < 10 ? `0${day}` : day;
    hour = hour < 10 ? `0${hour}` : hour;
    min = min < 10 ? `0${min}` : min;
    return {
      date: `${year}-${mon}-${day}`,
      time: `${hour}:${min}`
    }
  },

  trimAll: (value) => {
    return value.replace(/\s*/g, '');
  },

  isNumber: (value) => {
    if (value === '') return false;
    let mdata = Number(value);
    if (mdata === 0) return true;
    return !isNaN(mdata);
  },

  isArray: (value) => {
    return Object.prototype.toString.call(value) === '[object Array]';
  },

  isObject: (value) => {
    return Object.prototype.toString.call(value) === '[object Object]';
  },

  code2gender: (code) => {
    code = parseInt(code);
    switch (code) {
      case 0:
        return '男';
      case 1:
        return '女';
      case 2:
        return '保密';
      default:
        return '保密';
    }
  },

  gender2code: (gender) => {
    switch (gender) {
      case '男':
        return 0;
      case '女':
        return 1;
      case '保密':
        return 2;
      default:
        return 2;
    }
  },

  changeBills2Lists: function (bills) {
    let lists = [];
    bills.forEach((bill) => {
      const date = this.formatTime(new Date(bill.date)).date;
      const time = bill.time.substr(0, 5);
      const idx = lists.findIndex((list) => {
        return list.date === date;
      })
      const itemObj = {
        id: bill._id,
        bookType: bill.bookType,
        iconType: bill.iconType,
        title: bill.title,
        icon: bill.icon,
        color: bill.color,
        price: bill.price,
        label: bill.label,
        description: bill.description,
        time,
        position: bill.position,
        recorder: bill.recorder,
        longitude: bill.longitude,
        latitude: bill.latitude
      }
      if (idx === -1) {
        lists.push({
          date,
          expense: !itemObj.bookType ? itemObj.price : 0,
          income: itemObj.bookType ? itemObj.price : 0,
          items: [itemObj]
        })
      } else {
        // 0为支出，1为收入
        if (bill.bookType) {
          lists[idx].income += bill.price;
        } else {
          lists[idx].expense += bill.price;
        }
        lists[idx].items.push(itemObj);
      }
    })
    return lists;
  },

  changeList2Bills: function (lists) {
    let bills = [];
    lists.forEach(list => {
      list.items.forEach(item => {
        item.date = list.date;
        item._id = item.id;
        delete item.id;
        bills.push(item);
      })
    })
    return bills;
  },

  addBills2Lists: function (oldLists, newBills) {
    let bills = this.changeList2Bills(oldLists);
    bills = bills.concat(newBills);
    return this.changeBills2Lists(bills);
  },

  uploadImage: function (path, name) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: config.urlComponents.uploadUrl,
        filePath: path,
        header: {
          skey: wx.getStorageSync('skey')
        },
        name,
        success: res => {
          const resObj = JSON.parse(res.data);
          if (resObj.success) {
            resolve({ name: resObj.name })
            Util.showMessage('图片上传成功');
          }
        },
        fail: err => {
          Util.showMessage('图片上传失败');
          reject(err);
        }
      })
    })
  },

  uploadFile: (filePath, cloudPath) => {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: filePath,
        encoding: 'base64',
        success: res => {
          wx.cloud.callFunction({
            name: 'uploadFile',
            data: {
              saveField: 'avatar',
              cloudPath,
              file: res.data
            }
          }).then(res => {
            resolve(res);
          }).catch(err => {
            reject(err);
          })
        },
        fail: err => {
          reject(err);
        }
      })
    })
  }
}

module.exports = Util;