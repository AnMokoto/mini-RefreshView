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
      value: false
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
      type: "child",
      linked(target) {
        if (!this._headerTarget) {
          this._headerTarget = target
          this.measureHeader()
        }
      }
    },
    './refreshfooter': {
      type: "child",
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
    inertia: 500
  },

  /**
   * 组件的方法列表
   */
  methods: {

    ////////////////////view

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
          duration: 200,
          timingFunction: 'ease'
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

          console.log("#refresh-content-->" + res.height)
        })

        // 当前布局的高度
        var height = res.height
        // 屏幕显示最大高度
        var maxHeight = wx.getSystemInfoSync().windowHeight
        var contentHeight = Math.min(height, maxHeight)

        this.setData({
          // reset the height
          contentHeight: contentHeight,
        })

        console.log(".refreshview-->" + contentHeight)
      })
    },

    /**
     * @param value 当前滑动距离
     */
    interpolatorHeader(value) {
      // 正数
      // var sym = (value >> 31)
      var height = this.data.headerHeight + Math.abs(this._scroll)
      // var input = Math.abs(value)
      if (value <= height) {
        return value
      }
      return (height + Math.abs((value - height) * 0.5))
    },

    /**
     * @param value 当前滑动距离
     */
    interpolatorFooter(value) {
      // 负数
      var sym = (value >> 31)
      // 最大滑动距离
      var height = (this.data.contentBottom - this.data.contentHeight + this.data.footerHeight) - Math.abs(this._scroll)
      // 当次点击事件上次滑动总距离 + 当次滑动距离
      var input = Math.abs(value)
      // 计算
      if (input <= height) {
        return value
      }
      var footer = (height + Math.abs((height - input) * 0.125)) * sym
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
     * @param speed 速度
     * @param time
     */
    viewInertia(offset, speed, time) {
      var end = (offset + speed + this._scroll)
      // 滑动区间
      var a = 0
      var b = this.data.contentBottom - this.data.contentHeight
      end = Math.min(0, Math.max(end, -b))
      var animation = wx.createAnimation({
        timingFunction: 'ease-out',
        duration: time
      }).translateY(end)
      this.setData({
        scroll: end,
        animation: animation.step().export()
      })
    },

    _invalidateState() {
      setTimeout(() => {
        if (this.properties.isRefresh === true) {
          this._openRefresh()
        } else if (this.properties.isLoadMore === true) {
          this._openLoadMore()
        }

        this._ready = true
      }, 300)
    },

    //////////////////// refresh

    /**
     * 开启刷新窗口
     */
    _openRefresh() {
      if (this.data.enableRefresh && this.data.headerHeight > 0) {
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
      if (this.data.enableLoadMore && this.data.footerHeight > 0) {
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


    ///////////////////event

    onTouchStart(event) {
      let state = this.data.state
      if (state === REFRESH_STATE.REFRESH || state === REFRESH_STATE.LOADMORE)
        return
      this._LastY = event.touches[0].clientY
      this._scroll = this.data.scroll
      this._startTime = Date.now()
    },

    onTouchMove(event) {
      let state = this.data.state
      if (state === REFRESH_STATE.REFRESH || state === REFRESH_STATE.LOADMORE)
        return

      const y = event.touches[0].clientY
      // total move distance
      var offset = y - this._LastY
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
        }


      offset += this._scroll
      this.setData({
        scroll: offset,
        animationY: this.data.animationY.translateY(offset)
      })
    },

    onTouchEnd(event) {
      let state = this.data.state
      if (state === REFRESH_STATE.REFRESH || state === REFRESH_STATE.LOADMORE)
        return
      const y = event.changedTouches[0].clientY
      // total move distance
      var offset = y - this._LastY

      // var sym = (offset >> 31)
      var scroll = Math.abs(this.data.scroll)
      if (offset > 0 && this.data.scroll > 0) {
        // 下拉刷新
        if (this.data.scroll > (this.data.headerHeight >> 1)) {
          this._openRefresh()
        } else {
          this._closeRefresh()
        }
      } else if (offset < 0 && (scroll + this.data.contentHeight) > this.data.contentBottom) {
        var over = (this.data.contentBottom + (this.data.footerHeight >> 1))
        if ((scroll + this.data.contentHeight) > over) {
          this._openLoadMore()
        } else {
          this._closeLoadMore()
        }
      } else {
        //drop
        console.log("ignore")

        var endTime = Date.now()
        var time = endTime - this._startTime
        var speed = (offset / this.data.inertia) * 100

        this.viewInertia(offset, speed, time)
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
      console.log("onPageScroll--->")
      console.log(event)
    },

    loadViewRect(tag, target) {
      var query = target ? target.createSelectorQuery() : wx.createSelectorQuery().in(this)

      var promise = new Promise((resolve, reject) => {
        query.select(tag).fields({
          size: true,
          rect: true,
          scrollOffset: true,
          id: true
        }, function(res) {
          resolve(res)
        }).exec()
      })

      return promise
    },

    loadView(tag, target) {
      var query = target ? target.createSelectorQuery() : wx.createSelectorQuery().in(this)

      var promise = new Promise((resolve, reject) => {
        query.select(tag).boundingClientRect(function(res) {
          resolve(res)
        }).exec()
      })

      return promise
    }
  },

  observers: {
    isRefresh(val) {
      //第一次进入的在 ready里面执行
      if (!val) {
        this._closeRefresh()
      }
    },
    enableRefresh(val) {

    },
    isLoadMore(val) {
      //第一次进入的在 ready里面执行
      if (!val) {
        this._closeLoadMore()
      }
    },
    enableLoadMore(val) {

    },
    scroll(val) {
      console.log("scrollTop---->" + val)
    },

    headerHeight(val) {

    },
    animationY: function(val) {
      wx.nextTick(() => {
        if (this._ready) {
          this.setData({
            animation: val.step().export()
          })
        }
      })
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

  created() {},

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
