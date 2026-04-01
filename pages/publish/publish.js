const app = getApp()

Page({
  data: {
    images: [],
    description: '',
    latitude: 0,
    longitude: 0,
    placeName: '',
    placeId: '',
    locationText: '',
    isValidLocation: false,
    canPublish: false,
    submitting: false
  },

  onLoad(options) {
    this.placeId = options.placeId || ''
    this.placeName = options.placeName ? decodeURIComponent(options.placeName) : ''

    this.setData({
      placeId: this.placeId,
      placeName: this.placeName
    })

    this.initLocation()
  },

  initLocation() {
    const loc = app.globalData.location
    if (loc) {
      this.setData({
        latitude: loc.latitude,
        longitude: loc.longitude,
        locationText: `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`,
        isValidLocation: true
      })
      this.checkPublishable()
    }

    app.getLocation().then(res => {
      this.setData({
        latitude: res.latitude,
        longitude: res.longitude,
        locationText: `${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)}`,
        isValidLocation: true
      })
      this.checkPublishable()
    }).catch(() => {
      wx.showToast({ title: '请开启定位权限', icon: 'none' })
    })
  },

  chooseImage() {
    const remaining = 9 - this.data.images.length
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => f.tempFilePath)
        this.setData({
          images: [...this.data.images, ...newImages]
        })
        this.checkPublishable()
      }
    })
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index
    const images = [...this.data.images]
    images.splice(index, 1)
    this.setData({ images })
    this.checkPublishable()
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value })
  },

  checkPublishable() {
    const canPublish = this.data.images.length > 0 && this.data.isValidLocation
    this.setData({ canPublish })
  },

  async doPublish() {
    if (!this.data.canPublish || this.data.submitting) return

    this.setData({ submitting: true })

    try {
      // 上传图片
      const imageUrls = []
      for (const img of this.data.images) {
        const result = await app.uploadFile(img)
        imageUrls.push(result.url)
      }

      // 提交
      await app.request('/api/photos/publish', {
        method: 'POST',
        data: {
          place_id: parseInt(this.data.placeId) || 0,
          place_name: this.data.placeName,
          latitude: this.data.latitude,
          longitude: this.data.longitude,
          description: this.data.description,
          image_urls: imageUrls
        }
      })

      wx.showToast({ title: '投递成功！', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      wx.showToast({ title: err.message || '投递失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
