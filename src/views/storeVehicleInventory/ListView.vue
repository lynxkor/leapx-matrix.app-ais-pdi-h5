<template>
  <div class="list-container">
    <!-- 顶部横向滚动导航 - 固定不动 -->
    <div class="series-nav-scroll">
      <button
        v-for="(item, index) in dataList"
        :key="index"
        :class="['nav-btn', { active: currentSeriesIndex === index }]"
        @click="scrollToSeries(index)"
      >
        {{ item.seriesName }}
      </button>
    </div>

    <div class="common-scroll-content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div v-for="(item, index) in dataList" :key="index" class="series-card" :ref="'series-' + index">
            <!-- 车系标题 -->
            <div class="series-header">
              <span class="series-name">{{ item.seriesName }}</span>
              <span class="series-total">[ {{ getTotal(item.detailList) }} 辆 ]</span>
              <van-icon name="information-o" class="info-icon" />
            </div>

            <!-- 表头 -->
            <div class="table-header">
              <div class="th model-name">车型</div>
              <div class="th">在途</div>
              <div class="th">在库</div>
              <div class="th">预留</div>
              <div class="th">锁定</div>
              <div class="th available">
                可用
                <van-icon name="question-o" class="question-icon" @click="showQuestion = true" />
              </div>
            </div>

            <!-- 数据行 -->
            <div
              v-for="(detail, detailIndex) in item.detailList"
              :key="detailIndex"
              class="table-row"
              @click="onRowClick(detail)"
            >
              <div class="td model-name">{{ detail.modelName }}</div>
              <div class="td">{{ detail.transitQty || 0 }}</div>
              <div class="td">{{ detail.stockQty || 0 }}</div>
              <div class="td">{{ detail.reservedQty || 0 }}</div>
              <div class="td">{{ detail.lockedQty || 0 }}</div>
              <div class="td available">{{ detail.availableQty || 0 }}</div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <van-dialog
      v-model:show="showQuestion"
      title="车辆可用总数取数逻辑"
      message="在途 + 在库 - 预留 - 锁车 = 车辆可用总数"
      show-confirm-button
      :confirm-button-color="'#07c160'"
    />
  </div>
</template>

<script>
import { getList } from '@/api/storeVehicleInventory'

export default {
  name: 'StoreVehicleInventoryListView',

  data() {
    return {
      dataList: [],
      loading: false,
      finished: false,
      refreshing: false,
      showQuestion: false,
      currentSeriesIndex: 0,
      requestData: {
        pageNum: 1,
        pageSize: 100
      }
    }
  },
  created() {
    this.fetchData()
  },

  methods: {
    // 获取数据
    fetchData() {
      getList(this.requestData)
        .then(res => {
          console.log('res', res)
          if (res.code === 200) {
            const data = res.data
            // 兼容不同的返回字段
            const list = data || []

            if (this.refreshing) {
              this.dataList = list
            } else {
              this.dataList = this.dataList.concat(list)
            }

            // 判断是否加载完成
            const current = data.current || data.pageNum || 1
            const pageSize = data.pageSize || this.requestData.pageSize || 100
            const total = data.total || 0

            if (total === 0 || current * pageSize >= total) {
              this.finished = true
            } else {
              this.requestData.pageNum = current + 1
              this.finished = false
            }

            this.loading = false
            this.refreshing = false
          }
        })
        .catch(err => {
          console.log(err)
          this.loading = false
          this.refreshing = false
        })
    },

    onRefresh() {
      this.refreshing = true
      this.finished = false
      this.requestData.pageNum = 1
      this.fetchData()
    },

    onLoad() {
      if (!this.finished && !this.loading) {
        this.fetchData()
      }
    },

    // 计算总数
    getTotal(detailList) {
      if (!detailList || detailList.length === 0) return 0
      return detailList.reduce((sum, item) => sum + (item.availableQty || 0), 0)
    },

    // 滚动到指定车系
    scrollToSeries(index) {
      this.currentSeriesIndex = index
      this.$nextTick(() => {
        const refName = 'series-' + index
        const el = this.$refs[refName] && this.$refs[refName][0]
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    },

    // 行点击事件
    onRowClick(detail) {
      console.log('点击行:', detail)
      // TODO: 这里添加跳转逻辑，例如：
      // this.$router.push({ path: '/detail', query: { vin: detail.vin } })
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/libs/styles/variables' as *;

.list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.series-nav-scroll {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  padding: 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
  scrollbar-width: none;
  background: #fff;

  &::-webkit-scrollbar {
    display: none;
  }

  .nav-btn {
    flex-shrink: 0;
    padding: 4px 12px;
    background: transparent;
    border: none;
    font-family: PingFang SC;
    font-size: 14px;
    color: $leap-color-default-light-2;
    cursor: pointer;
    position: relative;

    &.active {
      color: $leap-color-success;
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 2px;
        background: $leap-color-success;
      }
    }
  }
}

.common-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: $leap-color-default-light-5;
}

.series-card {
  background: #ffffff;
  border-radius: 7px;
  padding: 12px;
  margin-bottom: 12px;

  .series-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .series-name {
      font-family: PingFang SC;
      font-size: 15px;
      font-weight: 600;
      color: $leap-color-success;
    }

    .series-total {
      font-family: PingFang SC;
      font-size: 14px;
      font-weight: 600;
      color: $leap-color-success;
      margin-left: 4px;
    }

    .info-icon {
      font-size: 14px;
      color: $leap-color-success;
      margin-left: 4px;
    }
  }

  .table-header {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 1fr;
    padding: 8px 0;
    border-bottom: 1px solid $leap-color-default-light-4;

    .th {
      font-family: PingFang SC;
      font-size: 12px;
      color: $leap-color-default-light-2;
      text-align: center;

      &.model-name {
        text-align: left;
      }

      &.available {
        color: $leap-color-success;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;

        .question-icon {
          font-size: 12px;
          cursor: pointer;
          opacity: 0.7;

          &:hover {
            opacity: 1;
          }
        }
      }
    }
  }

  .table-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 1fr;
    padding: 10px 0;
    border-bottom: 1px solid $leap-color-default-light-4;

    &:last-child {
      border-bottom: none;
    }

    .td {
      font-family: PingFang SC;
      font-size: 12px;
      color: $leap-color-default-light-1;
      text-align: center;

      &.model-name {
        text-align: left;
        color: $leap-color-default;
        font-weight: 500;
      }

      &.available {
        color: $leap-color-success;
        font-weight: 500;
      }
    }
  }
}
</style>
