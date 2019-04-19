// components/refreshview/refreshview.js
const REFRESH_STATE = {
  REFRESH: 0,
  DRAP_DOWN: 1,
  DRAP_OVER: 2,
  LOADMORE: 3,
  DEFAULT: -1
}

const View = {
  REFRESH: 'onRefresh',
  LOADMORE: 'onLoadMore'
}
/**
 * event = [onRefresh,onLoadMore]
 * @see [View.REFRESH] [View.LOADMORE]
 */
/* eslint-disable */
Component({
  /**
     * 组件的属性列表
     */
  properties: {

    isRefresh: {
      type: Boolean,
      value: false
    },
    enableRefresh: {
      type: Boolean,
      value: true
    },
    isLoadMore: {
      type: Boolean,
      value: false
    },
    enableLoadMore: {
      type: Boolean,
      value: false
    },
    adaptive: {
      type: Boolean,
      value: true
    },
    empty: {
      type: Object,
      value: null
    }
  },

  relations: {
    './refreshheader': {
      type: 'child',
      linked(target) {
        if (!this._headerTarget) {
          this._headerTarget = target
          this.measureHeader()
        }
      }
    },
    './refreshfooter': {
      type: 'child',
      linked(target) {
        if (!this._footerTarget) {
          this._footerTarget = target
          this.measureFooter()
        }
      }
    },
  },

  /**
     * 组件的初始数据
     */
  data: {
    headerHeight: 0,
    maxHeaderHeight: 0,
    footerHeight: 0,
    scroll: 0,
    contentHeight: 0,
    contentBottom: 0,
    height: '100%',
    state: REFRESH_STATE.DEFAULT,
    animationY: null,
    animationReset: null,
    animation: null,
    overflow: 'scroll',
    inertia: 16
  },

  /**
     * 组件的方法列表
     */
  methods: {

    // //////////////////view

    measureHeader() {
      wx.nextTick(() => {
        this.loadView('#refreshheader', this._headerTarget).then((res) => {
          if (res) {
            this.setData({
              headerHeight: Math.ceil(res.height)
            })
          }
        })
      })
    },

    measureFooter() {
      wx.nextTick(() => {
        this.loadView('#refreshfooter', this._footerTarget).then((res) => {
          if (res) {
            this.setData({
              footerHeight: Math.ceil(res.height)
            })
          }
        })
      })
    },

    /**
         * 调用刷新布局高度
         */
    invalidate() {
      this.measureHeader()
      this.measureFooter()
      this.invalidateContainer()
    },

    _initAnimation() {
      this.setData({
        animationY: wx.createAnimation({
          duration: 0,
          timingFunction: 'step-start'
        }),
        animationReset: wx.createAnimation({
          duration: 100,
          timingFunction: 'ease-in-out'
        })
      })
    },

    invalidateContainer() {
      this.loadView('.refreshview').then((res) => {
        // 内容页高度
        this.loadView('#refresh-content').then((res) => {
          // 当前 content的高度
          this.setData({
            contentBottom: res.height
          })

          console.log('#refresh-content-->' + res.height)
        })

        // 当前布局的高度
        const height = res.height
        // 屏幕显示最大高度
        const maxHeight = wx.getSystemInfoSync().windowHeight
        const contentHeight = Math.min(height, maxHeight)

        this.setData({
          // reset the height
          contentHeight,
        })

        console.log('.refreshview-->' + contentHeight)
      })
    },

    /**
         * @param value 当前滑动距离
         */
    interpolatorHeader(value) {
      // 正数
      // var sym = (value >> 31)
      // 抵消
      const height = this.data.headerHeight + Math.abs(this._scroll)
      // var input = Math.pow(value, 0.9)
      if (value <= height) {
        return value
      }
      return (height + Math.pow((value - height), 0.65))
    },

    /**
         * @param value 当前滑动距离
         */
    interpolatorFooter(value) {
      // 负数
      const sym = (value >> 31)
      // 最大滑动距离
      const height = (this.data.contentBottom - this.data.contentHeight + this.data.footerHeight) - Math.abs(this._scroll)
      // 当次点击事件上次滑动总距离 + 当次滑动距离
      // var input = Math.pow(Math.abs(value), 0.9)
      const input = Math.abs(value)
      // 计算
      if (input <= height) {
        return value
      }
      const footer = (height + Math.pow((input - height), 0.8)) * sym
      return footer
    },

    viewRebound(input) {
      wx.nextTick(() => {
        this.setData({
          scroll: input,
          animationReset: this.data.animationReset.translateY(input),
        })
      })
    },

    /**
         * 惯性滑动
         * @param offset 距离
         * @param time
         */
    viewInertia(offset, time) {
      const abc = 16
      if (time > 500) return // 非甩动
      // 一帧的速度
      let speed = (offset / time) * abc * 2
      // if (Math.abs(speed) < this.data.inertia) return // 最低速度

      const duration = 100

      // 已经滚掉的
      const scroll = offset + this._scroll

      // 滑动区间
      const a = 0
      const b = this.data.contentBottom - this.data.contentHeight - Math.abs(scroll)
      speed = Math.max(speed, -b)
      console.log('speed--->' + speed + ' scroll---->' + scroll)

      const sy = speed >= 0 ? 1 : (speed >> 31)

      const glob = this


      const dis = intertia(speed)
      var offset = 0

      this._interval = setInterval(function () {
        if (Math.abs(offset) >= Math.abs(speed)) {
          clearInterval(this._interval)
          return
        }
        const interceptor = show(offset / speed)
        let _scroll = (interceptor * speed) + glob.data.scroll
        // 滚动范围
        _scroll = Math.min(0, Math.max(_scroll, -(glob.data.contentBottom - glob.data.contentHeight)))
        offset += dis
        glob.setData({
          scroll: _scroll
        })
      }, abc)

      function intertia(speed) {
        return Math.min(Math.abs(speed) / 32, 0.5)
      }

      /**
             * @param input [0,1]
             */
      function show(input) {
        return (1 - ((Math.cos((input + 1) * Math.PI) / 2.0) + 0.5))
        // return ((Math.cos((input + 1) * Math.PI) / 2.0) + 0.5)
      }

      // this.setData({
      //   scroll: end,
      // })
    },

    _invalidateState() {
      setTimeout(() => {
        this._ready = true
          
        if (this.properties.isRefresh === true) {
          this._openRefresh()
        } else if (this.properties.isLoadMore === true) {
          this._openLoadMore()
        }
      }, 300)
    },

    // ////////////////// refresh

    /**
         * 开启刷新窗口
         */
    _openRefresh() {
      if (this.data.enableRefresh&& this._ready) {
        this.viewRebound(this.data.headerHeight)
        this.triggerEvent(View.REFRESH, {})
        this.setData({
          // isRefresh: true,
          state: REFRESH_STATE.REFRESH
        })
      }
    },

    _closeRefresh() {
      if (this.data.enableRefresh && this._ready) {
        this.viewRebound(0)
        this.setData({
          // isRefresh: false,
          state: REFRESH_STATE.DEFAULT
        })
        wx.nextTick(() => {
          this.invalidate()
        })
      }
    },
    /**
         * 开启加载窗口
         */
    _openLoadMore() {
      if (this.data.enableLoadMore && this._ready) {
        this.viewRebound(-(this.data.contentBottom - this.data.contentHeight + this.data.footerHeight))
        this.triggerEvent(View.LOADMORE, {})
        this.setData({
          // isLoadMore: true,
          state: REFRESH_STATE.LOADMORE
        })
      }
    },

    _closeLoadMore() {
      if (this.data.enableLoadMore && this._ready) {
        this.viewRebound(-(this.data.contentBottom - this.data.contentHeight))
        this.setData({
          // isLoadMore: false,
          state: REFRESH_STATE.DEFAULT
        })
        wx.nextTick(() => {
          this.invalidate()
        })
      }
    },


    // /////////////////event

    onTouchStart(event) {
      clearInterval(this._interval)
      const state = this.data.state
      if (state === REFRESH_STATE.REFRESH || state === REFRESH_STATE.LOADMORE) return
      this._LastY = event.touches[0].clientY
      this._scroll = this.data.scroll
      this._startTime = Date.now()
    },

    onTouchMove(event) {
      let state = this.data.state
      if (state === REFRESH_STATE.REFRESH || state === REFRESH_STATE.LOADMORE) return

      const y = event.touches[0].clientY
      // total move distance
      let offset = y - this._LastY
      state = REFRESH_STATE.DRAP_DOWN
      if (offset < 0) {
        // return // 向上滑动
        // 点击事件前置滑动距离 + 当前滑动距离 + 屏幕最大显示高度 >= 布局总高度
        if ((Math.abs(this._scroll) + Math.abs(offset) + this.data.contentHeight) >= this.data.contentBottom) {
          offset = this.interpolatorFooter(offset)
        }
      } else

      // var localP = this.data.scroll
      if (offset > 0 && this.data.scroll >= 0) {
        // 下拉刷新
        offset = this.interpolatorHeader(offset)
      } else {
        state = REFRESH_STATE.DEFAULT
        // var sym = offset >= 0 ? 1 : (offset >> 31)
        // offset = Math.pow(Math.abs(offset), 0.85) * sym
      }

      offset += this._scroll


      this.setData({
        scroll: offset,
        // animationY: this.data.animationY.translateY(offset)
      })
    },

    onTouchEnd(event) {
      const state = this.data.state
      if (state === REFRESH_STATE.REFRESH || state === REFRESH_STATE.LOADMORE) return
      const y = event.changedTouches[0].clientY
      // total move distance
      const offset = y - this._LastY


      const scroll = Math.abs(this.data.scroll)
      if (offset > 0 && this.data.scroll > 0) {
        // 下拉刷新
        if (this.data.scroll > (this.data.headerHeight >> 1)) {
          this._openRefresh()
        } else {
          this._closeRefresh()
        }
      } else if (offset < 0 && (scroll + this.data.contentHeight) > this.data.contentBottom) {
        const over = (this.data.contentBottom + (this.data.footerHeight >> 1))
        if ((scroll + this.data.contentHeight) > over) {
          this._openLoadMore()
        } else {
          this._closeLoadMore()
        }
      } else {
        // drop
        // var sym = offset >= 0 ? 1 : (offset >> 31)
        // offset = Math.pow(Math.abs(offset), 0.85) * sym
        
        const endTime = Date.now()
        const time = endTime - this._startTime
        this.viewInertia(offset, time)
      }
    },

    onTouchCancel(event) {
      console.log(event)
    },

    onTop(event) {

    },

    /**
         * @param event Page dispatch event
         */
    onPageScroll(event) {
      console.log('onPageScroll--->')
      console.log(event)
    },

    loadViewRect(tag, target) {
      const query = target ? target.createSelectorQuery() : wx.createSelectorQuery().in(this)

      const promise = new Promise((resolve, reject) => {
        query.select(tag).fields({
          size: true,
          rect: true,
          scrollOffset: true,
          id: true
        }, function (res) {
          resolve(res)
        }).exec()
      })

      return promise
    },

    loadView(tag, target) {
      const query = target ? target.createSelectorQuery() : wx.createSelectorQuery().in(this)

      const promise = new Promise((resolve, reject) => {
        query.select(tag).boundingClientRect(function (res) {
          resolve(res)
        }).exec()
      })

      return promise
    }
  },

  observers: {
    isRefresh(val) {
      // 第一次进入的在 ready里面执行
      if (!val) {
        this._closeRefresh()
      }
    },
    enableRefresh(val) {

    },
    isLoadMore(val) {
      // 第一次进入的在 ready里面执行
      if (!val) {
        this._closeLoadMore()
      }
    },
    enableLoadMore(val) {

    },
    scroll(val) {
      //console.log('scrollTop---->' + val)
    },

    headerHeight(val) {

    },
    animationY(val) {
      // wx.nextTick(() => {
      //   if (this._ready) {
      //     this.setData({
      //       animation: val.step().export()
      //     })
      //   }
      // })
    },
    animationReset(val) {
      wx.nextTick(() => {
        if (this._ready) {
          this.setData({
            animation: val.step().export()
          })
        }
      })
    }

  },

  attached() {
    // 在组件实例进入页面节点树时执行

  },
  detached() {
    // 在组件实例被从页面节点树移除时执行
  },

  created() {
  },

  onShow() {

  },

  ready() {
    this.invalidate()
    this._initAnimation()
    this._invalidateState()
  },

  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    styleIsolation: 'isolated' // 组件样式隔离
  },
})
