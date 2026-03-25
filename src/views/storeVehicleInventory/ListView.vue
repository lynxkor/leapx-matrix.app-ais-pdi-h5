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
              <span class="series-total">[ {{ item.available }} 辆 ]</span>
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
              <div class="td">{{ detail.onWay || 0 }}</div>
              <div class="td">{{ detail.inStock || 0 }}</div>
              <div class="td">{{ detail.reserved || 0 }}</div>
              <div class="td">{{ detail.locked || 0 }}</div>
              <div class="td available">{{ detail.available || 0 }}</div>
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

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { getList } from '@/api/storeVehicleInventory'

defineOptions({
  name: 'StoreVehicleInventoryListView'
})

const dataList = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const showQuestion = ref(false)
const currentSeriesIndex = ref(0)

const requestData = reactive({
  pageNum: 1,
  pageSize: 100
})

// 获取数据
const fetchData = () => {
  getList(requestData)
    .then((res) => {
      console.log('res', res)
      if (res.code === 200) {
        const data = res.data
        // 兼容不同的返回字段
        const list = data || []

        if (refreshing.value) {
          dataList.value = list
        } else {
          dataList.value = dataList.value.concat(list)
        }

        // 判断是否加载完成
        const current = data.current || data.pageNum || 1
        const pageSize = data.pageSize || requestData.pageSize || 100
        const total = data.total || 0

        if (total === 0 || current * pageSize >= total) {
          finished.value = true
        } else {
          requestData.pageNum = current + 1
          finished.value = false
        }

        loading.value = false
        refreshing.value = false
      }
    })
    .catch((err) => {
      console.log(err)
      loading.value = false
      refreshing.value = false
    })
}

const onRefresh = () => {
  refreshing.value = true
  finished.value = false
  requestData.pageNum = 1
  fetchData()
}

const onLoad = () => {
  if (!finished.value && !loading.value) {
    fetchData()
  }
}

// 滚动到指定车系
const scrollToSeries = (index) => {
  currentSeriesIndex.value = index
  nextTick(() => {
    const refName = 'series-' + index
    const el = refs.value[refName]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

// 行点击事件
const onRowClick = (detail) => {
  console.log('点击行:', detail)
  // router.push({ path: '/detail', query: { vin: detail.vin } })
}

// 存储 ref 的對象
const refs = ref({})

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
// @import '@/libs/assets/styles/variables.scss';

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

    font-size: 14px;
    color: var(--leap-color-default-light-2);
    cursor: pointer;
    position: relative;

    &.active {
      color: var(--leap-color-primary);
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 2px;
        background: var(--leap-color-primary);
      }
    }
  }
}

.common-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: var(--leap-color-default-light-5);
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

      font-size: 15px;
      font-weight: 600;
      color: var(--leap-color-primary);
    }

    .series-total {

      font-size: 14px;
      font-weight: 600;
      color: var(--leap-color-primary);
      margin-left: 4px;
    }

    .info-icon {
      font-size: 14px;
      color: var(--leap-color-primary);
      margin-left: 4px;
    }
  }

  .table-header {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 1fr;
    padding: 8px 0;
    border-bottom: 1px solid var(--leap-color-default-light-4);

    .th {

      font-size: 12px;
      color: var(--leap-color-primary);
      text-align: center;

      &.model-name {
        text-align: left;
      }

      &.available {
        color: var(--leap-color-primary);
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
    border-bottom: 1px solid var(--leap-color-default-light-4);

    &:last-child {
      border-bottom: none;
    }

    .td {

      font-size: 12px;
      color: var(--leap-color-default-light-1);
      text-align: center;

      &.model-name {
        text-align: left;
        color: var(--leap-color-default);
        font-weight: 500;
      }

      &.available {
        color: var(--leap-color-primary);
        font-weight: 500;
      }
    }
  }
}
</style>
