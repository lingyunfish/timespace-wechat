const app = getApp()

Page({
  data: {
    place: {},
    photos: [],
    leftPhotos: [],
    rightPhotos: [],
    isNearby: false,
    distanceText: '',
    sortType: 'latest',
    isGrid: true,
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 20
  },

  onLoad(options) {
    this.placeId = options.id
    this.placeLat = parseFloat(options.lat)
    this.placeLng = parseFloat(options.lng)
    wx.setNavigationBarTitle({ title: decodeURIComponent(options.name || '记忆点') })

    this.checkDistance()
    this.loadPlaceInfo()
    this.loadPhotos()
  },

  checkDistance() {
    const loc = app.globalData.location
    if (loc) {
      const dist = app.calcDistance(loc.latitude, loc.longitude, this.placeLat, this.placeLng)
      let distText = ''
      if (dist < 1000) {
        distText = Math.round(dist) + 'm'
      } else {
        distText = (dist / 1000).toFixed(1) + 'km'
      }
      this.setData({
        isNearby: dist <= 50,
        distanceText: distText
      })
    }
  },

  loadPlaceInfo() {
    app.request(`/api/places/${this.placeId}`).then(data => {
      this.setData({ place: data })
    }).catch(() => {
      this.setData({
        place: {
          id: this.placeId,
          name: decodeURIComponent(this.options?.name || '记忆点'),
          description: '一个充满故事的地方',
          photo_count: 42,
          visitor_count: 128,
          like_count: 356,
          is_official: true
        }
      })
    })
  },

  loadPhotos(reset = true) {
    if (this.data.loading) return
    if (reset) {
      this.setData({ page: 1, hasMore: true, photos: [] })
    }

    this.setData({ loading: true })
    const { page, pageSize, sortType } = this.data

    app.request(`/api/places/${this.placeId}/photos`, {
      data: { page, page_size: pageSize, sort: sortType }
    }).then(data => {
      const photos = (data.photos || []).map(p => ({
        ...p,
        time_text: this.formatTime(p.created_at)
      }))
      const allPhotos = reset ? photos : [...this.data.photos, ...photos]
      this.setData({
        photos: allPhotos,
        hasMore: photos.length >= pageSize,
        loading: false
      })
      this.splitWaterfall(allPhotos)
    }).catch(() => {
      this.loadMockPhotos(reset)
    })
  },

  loadMockPhotos(reset) {
    const mockPhotos = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      image_url: '',
      thumbnail_url: '',
      user_name: ['探索者', '旅行家', '摄影师', '记录者'][i % 4],
      user_avatar: '',
      description: ['美好的一天', '此刻的宁静', '时光倒流', '', '留下足迹', '难忘瞬间'][i % 6],
      like_count: Math.floor(Math.random() * 200),
      comment_count: Math.floor(Math.random() * 50),
      created_at: Date.now() - i * 86400000,
      time_text: this.formatTime(Date.now() - i * 86400000),
      is_preview: i < 3
    }))

    const allPhotos = reset ? mockPhotos : [...this.data.photos, ...mockPhotos]
    this.setData({
      photos: allPhotos,
      hasMore: false,
      loading: false
    })
    this.splitWaterfall(allPhotos)
  },

  splitWaterfall(photos) {
    const left = [], right = []
    photos.forEach((p, i) => {
      const item = { ...p, _index: i }
      if (i % 2 === 0) left.push(item)
      else right.push(item)
    })
    this.setData({ leftPhotos: left, rightPhotos: right })
  },

  switchSort(e) {
    const type = e.currentTarget.dataset.type
    if (type === this.data.sortType) return
    this.setData({ sortType: type })
    this.loadPhotos(true)
  },

  toggleLayout() {
    this.setData({ isGrid: !this.data.isGrid })
  },

  viewPhoto(e) {
    const photo = e.currentTarget.dataset.photo
    if (!this.data.isNearby && !photo.is_preview) {
      wx.showToast({ title: '需到达此地点附近才能查看', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/photo/photo?id=${photo.id}&placeId=${this.placeId}`
    })
  },

  goPublish() {
    if (!this.data.isNearby) {
      wx.showToast({ title: '需到达此地点附近才能投递', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/publish/publish?placeId=${this.placeId}&placeName=${encodeURIComponent(this.data.place.name)}`
    })
  },

  formatTime(ts) {
    if (!ts) return ''
    const date = new Date(typeof ts === 'string' ? ts : ts)
    const now = new Date()
    const diff = now - date
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    if (diff < 2592000000) return Math.floor(diff / 86400000) + '天前'
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  onPullDownRefresh() {
    this.loadPlaceInfo()
    this.loadPhotos(true)
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadPhotos(false)
    }
  }
})
