const app = getApp()

Page({
  data: {
    photoList: [],
    currentIndex: 0,
    currentPhoto: {},
    comments: [],
    commentText: '',
    isNearby: false
  },

  onLoad(options) {
    this.photoId = options.id
    this.placeId = options.placeId
    this.checkNearby()
    this.loadPhoto()
    this.loadComments()
  },

  checkNearby() {
    // 简化: 默认认为在附近
    this.setData({ isNearby: true })
  },

  loadPhoto() {
    app.request(`/api/photos/${this.photoId}`).then(data => {
      const photo = {
        ...data,
        time_text: this.formatTime(data.created_at)
      }
      this.setData({
        photoList: data.images ? data.images.map((url, i) => ({
          id: i,
          image_url: url
        })) : [photo],
        currentPhoto: photo
      })
    }).catch(() => {
      const mock = {
        id: this.photoId,
        image_url: '',
        user_name: '探索者',
        user_avatar: '',
        description: '在这里留下了一段美好的记忆',
        like_count: 42,
        comment_count: 8,
        place_name: '记忆点',
        created_at: Date.now() - 86400000,
        time_text: '1天前',
        is_liked: false
      }
      this.setData({
        photoList: [mock],
        currentPhoto: mock
      })
    })
  },

  loadComments() {
    app.request(`/api/photos/${this.photoId}/comments`).then(data => {
      const comments = (data.comments || []).map(c => ({
        ...c,
        time_text: this.formatTime(c.created_at)
      }))
      this.setData({ comments })
    }).catch(() => {
      this.setData({
        comments: [
          { id: 1, user_name: '旅行家', content: '好美的风景！', time_text: '2小时前' },
          { id: 2, user_name: '摄影师', content: '角度很棒', time_text: '5小时前' }
        ]
      })
    })
  },

  onSwiperChange(e) {
    const idx = e.detail.current
    this.setData({
      currentIndex: idx,
      currentPhoto: this.data.photoList[idx] || this.data.currentPhoto
    })
  },

  previewImage(e) {
    const urls = this.data.photoList.map(p => p.image_url).filter(Boolean)
    if (urls.length > 0) {
      wx.previewImage({
        current: e.currentTarget.dataset.url,
        urls
      })
    }
  },

  toggleLike() {
    const photo = this.data.currentPhoto
    const isLiked = !photo.is_liked
    const likeCount = isLiked ? (photo.like_count || 0) + 1 : (photo.like_count || 0) - 1

    this.setData({
      'currentPhoto.is_liked': isLiked,
      'currentPhoto.like_count': likeCount
    })

    app.request(`/api/photos/${this.photoId}/like`, {
      method: 'POST',
      data: { action: isLiked ? 'like' : 'unlike' }
    }).catch(() => {})
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value })
  },

  sendComment() {
    const content = this.data.commentText.trim()
    if (!content) return

    app.request(`/api/photos/${this.photoId}/comments`, {
      method: 'POST',
      data: { content }
    }).then(data => {
      const newComment = {
        id: data.id || Date.now(),
        user_name: app.globalData.userInfo?.nickname || '我',
        user_avatar: app.globalData.userInfo?.avatar_url || '',
        content: content,
        time_text: '刚刚'
      }
      this.setData({
        comments: [newComment, ...this.data.comments],
        commentText: ''
      })
    }).catch(() => {
      const newComment = {
        id: Date.now(),
        user_name: '我',
        content: content,
        time_text: '刚刚'
      }
      this.setData({
        comments: [newComment, ...this.data.comments],
        commentText: ''
      })
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
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
})
