const app = getApp()

const LEVEL_TITLES = {
  1: '初来乍到',
  2: '城市漫步',
  3: '探索达人',
  4: '记忆猎手',
  5: '时空旅者',
  6: '传奇探险家'
}

Page({
  data: {
    userInfo: null,
    stats: {},
    levelTitle: '初来乍到',
    achievements: [
      { id: 1, icon: '🏅', name: '初次投递', unlocked: true },
      { id: 2, icon: '🌍', name: '探索5地', unlocked: true },
      { id: 3, icon: '📸', name: '投递达人', unlocked: false, progress: '8/20' },
      { id: 4, icon: '🔥', name: '连续签到', unlocked: false, progress: '3/7' },
      { id: 5, icon: '⭐', name: '百赞之星', unlocked: false, progress: '42/100' },
      { id: 6, icon: '🗺️', name: '城市征服', unlocked: false, progress: '2/10' }
    ]
  },

  onShow() {
    this.loadUserInfo()
    this.loadStats()
    this.loadAchievements()
  },

  loadUserInfo() {
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      this.setData({
        userInfo,
        levelTitle: LEVEL_TITLES[userInfo.level] || LEVEL_TITLES[1]
      })
    }
  },

  loadStats() {
    app.request('/api/user/stats').then(data => {
      this.setData({ stats: data })
    }).catch(() => {
      this.setData({
        stats: {
          photo_count: 23,
          place_count: 8,
          like_received: 356,
          achievement_count: 2
        }
      })
    })
  },

  loadAchievements() {
    app.request('/api/user/achievements').then(data => {
      if (data.achievements) {
        this.setData({ achievements: data.achievements })
      }
    }).catch(() => {})
  },

  doLogin() {
    app.login().then(data => {
      this.setData({
        userInfo: data.user_info || { nickname: '时空旅行者', level: 1 },
        levelTitle: LEVEL_TITLES[(data.user_info || {}).level || 1]
      })
      this.loadStats()
    }).catch(() => {
      wx.showToast({ title: '登录失败', icon: 'none' })
    })
  },

  goMyPhotos() {
    wx.showToast({ title: '我的投递', icon: 'none' })
  },

  goMyFavorites() {
    wx.showToast({ title: '我的收藏', icon: 'none' })
  },

  goFootprint() {
    wx.showToast({ title: '足迹地图', icon: 'none' })
  },

  goVip() {
    wx.showToast({ title: '会员功能开发中', icon: 'none' })
  },

  viewAllAchievements() {
    wx.showToast({ title: '成就系统', icon: 'none' })
  },

  goSettings() {
    wx.showToast({ title: '设置', icon: 'none' })
  },

  goAbout() {
    wx.showToast({ title: '时空记忆胶囊 v1.0.0', icon: 'none' })
  },

  onPullDownRefresh() {
    this.loadUserInfo()
    this.loadStats()
    this.loadAchievements()
    wx.stopPullDownRefresh()
  }
})
