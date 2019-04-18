// miniprogram/pages/test/test.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        enableRefresh: true,
        isRefresh: true,
        data: new Array()
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this.refreshview = this.selectComponent("#refreshView")
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        this.onRefresh()
    },

    _createData() {
        wx.nextTick(() => {
            // if (this.refreshview) {
            //   this.refreshview.invalidate()
            // }
        })
        var data = "0".repeat(60).split("")
        this.setData({
            data: data,
            isRefresh: false
        })
    },

    _addData() {
        wx.nextTick(() => {
            // if (this.refreshview) {
            //   this.refreshview.invalidate()
            // }
        })
        var data = "0".repeat(20).split("")
        var array = [].concat(this.data.data).concat(data)

        this.setData({
            data: array,
            isLoadMore: false
        })
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    },
    onPageScroll(event) {
        this.refreshview.onPageScroll(event)
    },
    onRefresh() {
        setTimeout(() => {
            this._createData()
        }, 2500)
    },

    onLoadMore() {
        setTimeout(() => {
            this._addData()
        }, 2500)
    }
})
