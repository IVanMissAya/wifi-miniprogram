// miniprogram/pages/wifiHelper/index.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    CustomBar: app.globalData.CustomBar,
    modalName: "",
    currentIndex: "",
    wifiPass: "",
    wifiList: [],
    againRequest: true,
    loadModal: false,
    platform: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this;
    //检测手机型号
    wx.getSystemInfo({
      success: function (res) {
        /**当前运行平台 */
        _this.data.platform = res.platform;
        var system = '';
        if (res.platform == 'android') system = parseInt(res.system.substr(8));
        if (res.platform == 'ios') system = parseInt(res.system.substr(4));
        if (res.platform == 'android' && system < 6) {
          _this.hideLoading();
          wx.showToast({
            title: '手机版本不支持',
          })
          return
        }
        if (res.platform == 'ios' && system < 11.2) {
          _this.hideLoading();
          wx.showToast({
            title: '手机版本不支持',
          })
          return
        }
      }
    })
  },

  /**
   * 查询wifi列表
   */
  wifiMethod: function () {
    let _this = this;
    _this.showLoading();
    //2.初始化 Wi-Fi 模块
    _this.startWifi();
  },
  startWifi: function () {
    let _this = this;
    wx.getSetting({
      withSubscriptions: true,
      success: (res) => {
        console.log("res---", res);
        /**是否开启 位置权限 */
        if (!res.authSetting['scope.userLocation']) {
          /* 授权 */
          wx.authorize({
            scope: 'scope.userLocation',
            success: (authRes) => {
              console.log("authRes----", authRes);
              /** WIFI模块 */
              _this.getWifiList();
            },
            fail: (res) => {
              wx.showModal({
                title: "提示",
                content: "请同意WIFI权限",
                showCancel: false,
                confirmText: "确认"
              })
            }
          })
          return;
        }
        /** WIFI模块 */
        _this.getWifiList();
      }
    })
  },
  /**
   * 获取wifi列表
   */
  getWifiList: function () {
    let _this = this;
    console.log("_this.data.platform---", _this.data.platform);
    wx.startWifi({
      success: (startRes) => {

        if (_this.data.platform == "android") {
          wx.getWifiList({
            success: (res) => {
              console.log("res---", res);
              wx.onGetWifiList((result) => {
                console.log("result---", result);
                // console.log("result---", JSON.stringify(result.wifiList.slice(0, 20)));
                if (result.wifiList.length > 0) {
                  _this.data.wifiList = result.wifiList;
                  _this.setData({
                    wifiList: _this.data.wifiList,
                    loadModal: false
                  })
                }
              })
            },
            fail: (t) => {
              console.log("t---", t);
              _this.hideLoading();
              if (t.errCode == 12005) {
                wx.showModal({
                  title: "提示",
                  content: "请打开手机WIFI"
                })
              }
            }
          })
        }
        if (_this.data.platform == "ios") {
          wx.getWifiList({
            success: (res) => {
              console.log("res---", res);
              wx.onGetWifiList((result) => {
                console.log("result---", result);
                if (result.wifiList.length) {
                  wx.setWifiList({
                    wifiList: result.wifiList,
                    success: (resList) => {
                      _this.data.wifiList = result.wifiList;
                      _this.setData({
                        wifiList: _this.data.wifiList,
                        loadModal: false
                      })
                    }
                  })
                  return;
                }
                _this.hideLoading();
                wx.showToast({
                  title: '附近暂无可用wifi',
                  icon: "none"
                })
              })
            },
            fail: (t) => {
              console.log("t---", t);
              _this.hideLoading();
              if (t.errCode == 12005) {
                wx.showModal({
                  title: "提示",
                  content: "请打开手机WIFI"
                })
              }
            }
          })

        }

      },
      fail: (e) => {
        console.log("e---", e);
        _this.hideLoading();
        wx.showToast({
          title: '接口调用失败',
        })
      }
    })
  },
  /**
   * 连接wifi
   */
  concat: function (data) {
    let _this = this;
    let SSID = _this.data.wifiList[_this.data.currentIndex].SSID,
      BSSID = _this.data.wifiList[_this.data.currentIndex].BSSID,
      PASSWORD = data.detail.value.wifipass;

    if (_this.data.platform == "ios") {
      wx.showLoading({
        title: '连接中',
      })
    }

    if (_this.data.againRequest) {
      wx.connectWifi({
        SSID: SSID,
        BSSID: BSSID,
        password: PASSWORD,
        maunal: false,
        success: function (res) {
          if (res.errCode == 0 || res.errMsg == "connectWifi:ok") {
            wx.onWifiConnected((result) => {
              if (result.wifi) {
                wx.showToast({
                  title: 'wifi连接成功',
                  icon: "success",
                  success: () => {
                    _this.setData({
                      modalName: ""
                    })
                  }
                })
              }
            })
          }
          _this.hideLoading();
          wx.showToast({
            title: '连接失败,请重试',
            icon: "none"
          })
        },
        fail: function (res) {
          console.log("fail res---", res);
          // if (_this.data.againRequest) {
          //   _this.concat(data);
          //   _this.data.againRequest = false;
          // }
          if (res.errCode == 12003 || res.errCode == 12002) {
            wx.showToast({
              title: "wifi连接失败,请更换密码后重新连接",
              icon: "none"
            })
          } else {
            wx.showToast({
              title: res.errMsg,
              icon: "none"
            })
          }
        },
        complete: () => {
          wx.hideLoading({
            success: (res) => {},
          })
        }
      })
    }

  },
  showLoading() {
    this.setData({
      loadModal: true
    })
  },
  hideLoading() {
    this.setData({
      loadModal: false
    })
  },
  /**
   * 输入框输入事件
   * @param {*} e 
   */
  bindKeyInput: function (e) {
    let _this = this;
    _this.data.wifiPass = e.detail.value;
    _this.setData({
      wifiPass: e.detail.value
    })
  },
  /**
   * 显示模态框
   * @param {*} e 
   */
  showModal: function (e) {
    let _this = this;
    let index = e.currentTarget.dataset.index;
    _this.data.currentIndex = index;
    _this.data.againRequest = true;
    _this.setData({
      wifiPass: "",
      modalName: "DialogModal1"
    })
  },
  /**
   * 隐藏模态框
   * @param {*} e 
   */
  hideModal(e) {
    this.setData({
      modalName: null
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})