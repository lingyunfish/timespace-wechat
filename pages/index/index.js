const app = getApp()

Page({
  data: {
    statusBarHeight: 44,
    latitude: 39.908823,
    longitude: 116.397470,
    scale: 15,
    markers: [],
    nearbyCount: 0,
    showPreview: false,
    selectedPlace: null,
    showSearch: false,
    searchKeyword: '',
    searchResults: [],
    showAchievement: false,
    achievementTitle: '',
    achievementDesc: ''
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 44 })
    this.mapCtx = wx.createMapContext('mainMap')
  },

  onShow() {
    this.initLocation()
  },

  initLocation() {
    const loc = app.globalData.location
    if (loc) {
      this.setData({
        latitude: loc.latitude,
        longitude: loc.longitude
      })
      this.loadNearbyPlaces()
    } else {
      app.getLocation().then(res => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        })
        this.loadNearbyPlaces()
      }).catch(() => {
        this.loadNearbyPlaces()
      })
    }
  },

  loadNearbyPlaces() {
    const { latitude, longitude } = this.data
    app.request('/api/places/nearby', {
      data: {
        latitude,
        longitude,
        radius: 5000
      }
    }).then(data => {
      const places = data.places || []
      const markers = places.map((place, idx) => {
        const isNearby = app.calcDistance(
          latitude, longitude,
          place.latitude, place.longitude
        ) <= 50
        return {
          id: place.id,
          latitude: place.latitude,
          longitude: place.longitude,
          width: 44,
          height: 44,
          iconPath: isNearby ? '/images/tab-explore-active.png' : '/images/tab-explore.png',
          callout: {
            content: `${place.name}\n📷 ${place.photo_count}张`,
            color: '#333',
            fontSize: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#eee',
            bgColor: '#fff',
            padding: 8,
            display: 'BYCLICK',
            textAlign: 'center'
          },
          _data: place
        }
      })

      const nearbyCount = places.filter(p =>
        app.calcDistance(latitude, longitude, p.latitude, p.longitude) <= 500
      ).length

      this.setData({ markers, nearbyCount })
      this._placesData = places
    }).catch(() => {
      // 使用模拟数据
      this.loadMockData()
    })
  },

  loadMockData() {
    const { latitude, longitude } = this.data
    const mockPlaces = [
      {
        id: 1, name: '天安门广场', description: '中华人民共和国的象征',
        latitude: latitude + 0.003, longitude: longitude + 0.002,
        photo_count: 128, is_official: true,
        photos: [
          { id: 1, thumbnail_url: '' },
          { id: 2, thumbnail_url: '' }
        ]
      },
      {
        id: 2, name: '故宫博物院', description: '明清两代的皇家宫殿',
        latitude: latitude + 0.006, longitude: longitude - 0.001,
        photo_count: 256, is_official: true,
        photos: []
      },
      {
        id: 3, name: '街角咖啡馆', description: '一个充满故事的小角落',
        latitude: latitude - 0.002, longitude: longitude + 0.004,
        photo_count: 15, is_official: false,
        photos: []
      },
      {
        id: 4, name: '城市公园', description: '周末散步的好去处',
        latitude: latitude - 0.004, longitude: longitude - 0.003,
        photo_count: 42, is_official: false,
        photos: []
      },
      {
        id: 5, name: '老城墙遗址', description: '历史的痕迹',
        latitude: latitude + 0.001, longitude: longitude - 0.005,
        photo_count: 8, is_official: true,
        photos: []
      }
    ]

    const markers = mockPlaces.map(place => {
      const dist = app.calcDistance(latitude, longitude, place.latitude, place.longitude)
      const isNearby = dist <= 50
      return {
        id: place.id,
        latitude: place.latitude,
        longitude: place.longitude,
        width: 44,
        height: 44,
        iconPath: isNearby ? '/images/tab-explore-active.png' : '/images/tab-explore.png',
        callout: {
          content: `${place.name}\n📷 ${place.photo_count}张`,
          color: '#333',
          fontSize: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#eee',
          bgColor: '#fff',
          padding: 8,
          display: 'BYCLICK',
          textAlign: 'center'
        },
        _data: place
      }
    })

    this._placesData = mockPlaces
    this.setData({
      markers,
      nearbyCount: mockPlaces.filter(p =>
        app.calcDistance(latitude, longitude, p.latitude, p.longitude) <= 500
      ).length
    })
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId || e.markerId
    const place = this._placesData?.find(p => p.id === markerId)
    if (!place) return

    const loc = app.globalData.location
    let distance = 0
    let distanceText = ''
    let isNearby = false
    if (loc) {
      distance = app.calcDistance(loc.latitude, loc.longitude, place.latitude, place.longitude)
      isNearby = distance <= 50
      if (distance < 1000) {
        distanceText = Math.round(distance) + 'm'
      } else {
        distanceText = (distance / 1000).toFixed(1) + 'km'
      }
    }

    this.setData({
      selectedPlace: {
        ...place,
        distance,
        distance_text: distanceText,
        is_nearby: isNearby
      },
      showPreview: true
    })
  },

  closePreview() {
    this.setData({ showPreview: false })
    setTimeout(() => {
      this.setData({ selectedPlace: null })
    }, 300)
  },

  goToPlace() {
    const place = this.data.selectedPlace
    if (!place) return

    wx.navigateTo({
      url: `/pages/place/place?id=${place.id}&name=${encodeURIComponent(place.name)}&lat=${place.latitude}&lng=${place.longitude}`
    })
  },

  moveToLocation() {
    app.getLocation().then(res => {
      this.setData({
        latitude: res.latitude,
        longitude: res.longitude
      })
      this.mapCtx.moveToLocation()
      this.loadNearbyPlaces()
    })
  },

  onPublish() {
    const loc = app.globalData.location
    if (!loc) {
      wx.showToast({ title: '获取位置中...', icon: 'loading' })
      app.getLocation().then(() => {
        wx.navigateTo({ url: '/pages/publish/publish' })
      }).catch(() => {
        wx.showToast({ title: '请开启定位权限', icon: 'none' })
      })
      return
    }
    wx.navigateTo({ url: '/pages/publish/publish' })
  },

  onRegionChange(e) {
    if (e.type === 'end' && e.causedBy === 'drag') {
      this.mapCtx.getCenterLocation({
        success: (res) => {
          this.setData({
            latitude: res.latitude,
            longitude: res.longitude
          })
          this.loadNearbyPlaces()
        }
      })
    }
  },

  showNearbyList() {
    // 展示附近记忆点列表
    wx.showActionSheet({
      itemList: (this._placesData || [])
        .filter(p => {
          const loc = app.globalData.location
          return loc && app.calcDistance(loc.latitude, loc.longitude, p.latitude, p.longitude) <= 500
        })
        .slice(0, 6)
        .map(p => p.name + ' (' + p.photo_count + '张)'),
      success: (res) => {
        const nearbyPlaces = (this._placesData || []).filter(p => {
          const loc = app.globalData.location
          return loc && app.calcDistance(loc.latitude, loc.longitude, p.latitude, p.longitude) <= 500
        })
        const place = nearbyPlaces[res.tapIndex]
        if (place) {
          wx.navigateTo({
            url: `/pages/place/place?id=${place.id}&name=${encodeURIComponent(place.name)}&lat=${place.latitude}&lng=${place.longitude}`
          })
        }
      }
    })
  },

  onSearchTap() {
    this.setData({ showSearch: true })
  },

  closeSearch() {
    this.setData({ showSearch: false, searchKeyword: '', searchResults: [] })
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    if (e.detail.value.length > 0) {
      this.doSearch()
    }
  },

  doSearch() {
    const keyword = this.data.searchKeyword
    if (!keyword) return

    app.request('/api/places/search', {
      data: { keyword }
    }).then(data => {
      this.setData({ searchResults: data.places || [] })
    }).catch(() => {
      // 模拟搜索
      const mockResults = (this._placesData || []).filter(p =>
        p.name.includes(keyword) || (p.description && p.description.includes(keyword))
      )
      this.setData({ searchResults: mockResults })
    })
  },

  onSelectSearchResult(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      latitude: item.latitude,
      longitude: item.longitude,
      showSearch: false,
      searchKeyword: '',
      searchResults: []
    })
    this.loadNearbyPlaces()
  },

  showAchievementToast(title, desc) {
    this.setData({
      showAchievement: true,
      achievementTitle: title,
      achievementDesc: desc
    })
    setTimeout(() => {
      this.setData({ showAchievement: false })
    }, 3000)
  }
})
