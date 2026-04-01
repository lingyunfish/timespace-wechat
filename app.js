App({
  globalData: {
    userInfo: null,
    token: '',
    location: null,
    baseUrl: 'http://localhost:8080'
  },

  onLaunch() {
    this.checkLogin()
    this.getLocation()
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      this.getUserInfo()
    }
  },

  login() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            this.request('/api/user/login', {
              method: 'POST',
              data: { code: res.code }
            }).then(data => {
              this.globalData.token = data.token
              this.globalData.userInfo = data.user_info
              wx.setStorageSync('token', data.token)
              resolve(data)
            }).catch(reject)
          } else {
            reject(new Error('登录失败'))
          }
        },
        fail: reject
      })
    })
  },

  getUserInfo() {
    return this.request('/api/user/info').then(data => {
      this.globalData.userInfo = data
      return data
    })
  },

  getLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        isHighAccuracy: true,
        highAccuracyExpireTime: 3000,
        success: (res) => {
          this.globalData.location = {
            latitude: res.latitude,
            longitude: res.longitude,
            accuracy: res.accuracy
          }
          resolve(res)
        },
        fail: reject
      })
    })
  },

  request(url, options = {}) {
    const { baseUrl, token } = this.globalData
    return new Promise((resolve, reject) => {
      wx.request({
        url: baseUrl + url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          if (res.data.code === 0) {
            resolve(res.data.data)
          } else if (res.data.code === 401) {
            this.login().then(() => {
              this.request(url, options).then(resolve).catch(reject)
            }).catch(reject)
          } else {
            wx.showToast({ title: res.data.msg || '请求失败', icon: 'none' })
            reject(new Error(res.data.msg))
          }
        },
        fail: (err) => {
          wx.showToast({ title: '网络错误', icon: 'none' })
          reject(err)
        }
      })
    })
  },

  uploadFile(filePath) {
    const { baseUrl, token } = this.globalData
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: baseUrl + '/api/upload',
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            resolve(data.data)
          } else {
            reject(new Error(data.msg))
          }
        },
        fail: reject
      })
    })
  },

  calcDistance(lat1, lng1, lat2, lng2) {
    const rad = Math.PI / 180
    const R = 6371000
    const dLat = (lat2 - lat1) * rad
    const dLng = (lng2 - lng1) * rad
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
})
