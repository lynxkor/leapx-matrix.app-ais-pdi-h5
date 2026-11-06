<template>
  <!-- 列表页被 keepAlive 缓存，跳走后组件不卸载；用路由判断避免入口残留在其他页面头部 -->
  <Teleport to="#header-right-portal" defer>
    <span v-if="route.name === 'RiskCheckTaskListView'" class="audit-entry" @click="goAudit">
      任务审核
    </span>
  </Teleport>
  <filter-header
    ref="filterHeaderRef"
    :placeholder="'搜索任务编号/任务名称'"
    :show-scan="false"
    :show-sort="false"
    :show-filter="false"
    :filterList="[]"
    @search="headerSearch"
  />
  <div class="tab-content">
    <van-tabs v-model:active="active" sticky>
      <van-tab v-for="(item, index) in tabList" :title="item" :key="index"></van-tab>
    </van-tabs>
  </div>
  <div class="common-scroll-content" ref="scrollEle">
    <refresh-list
      ref="refreshListRef"
      :requestData="requestData"
      :needRefresh="needRefresh"
      :has-no-data="dataList.length === 0"
      :show-reset-button="!!requestData.data.keyLike"
      @setData="setData"
      @resetFilters="resetFilterConditions"
    >
      <div
        class="task-card"
        v-for="item in dataList"
        :key="item.id"
        @click="goDetail(item)"
      >
        <div class="card-header">
          <div class="title-wrap">
            <div class="card-title">{{ item.taskName }}</div>
            <!-- 门店名称：子任务 dealerName（发布时按门店回填） -->
            <div class="card-dealer">门店名称：{{ item.dealerName || '-' }}</div>
          </div>
          <!-- 锁车标识：1锁定=红字，0不锁定=绿字，文案取后端 lockVehicleFlagLabel -->
          <span
            v-if="item.lockVehicleFlag === 1"
            class="lock-label lock-red"
          >{{ item.lockVehicleFlagLabel}}</span>
          <span
            v-else-if="item.lockVehicleFlag === 0"
            class="lock-label lock-green"
          >{{ item.lockVehicleFlagLabel }}</span>
        </div>
        <div class="card-desc">
          <!-- 排查原因：内容前加标签，格式同门店名称 -->
          排查原因：{{ item.checkReason || '-' }}
        </div>
        <div class="card-audit">审核方式：{{ item.auditTypeLabel || '-' }}</div>
        <div class="card-progress">
          <div class="progress-text-row">
            <span class="progress-count">
              完成 {{ item.finishedVehicleCount || 0 }}/{{ item.totalVehicleCount || 0 }}
            </span>
            <span class="progress-rate">{{ progressRate(item) }}%</span>
          </div>
          <van-progress
            class="progress-bar"
            :percentage="progressPercent(item)"
            color="#00AA00"
            track-color="#e5e5e5"
            :show-pivot="false"
          />
        </div>
      </div>
    </refresh-list>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FilterHeader from '@/libs/components/FilterHeader.vue'
import RefreshList from '@/libs/components/RefreshList.vue'
import { getRiskCheckTaskList } from '@/api/riskCheck'

defineOptions({
  name: 'RiskCheckTaskListView'
})

const router = useRouter()
const route = useRoute()
const filterHeaderRef = ref(null)
const refreshListRef = ref(null)
const scrollEle = ref(null)

// 进行中=60 已结束=110（子任务只有这两种状态，无「全部」tab）
const tabList = ['进行中', '已结束']
const statusByTab = ['60', '110']
const active = ref(0)
const needRefresh = ref(false)
const dataList = ref([])
const requestData = reactive({
  data: {
    keyLike: '',
    taskStatusList: ['60'],
    pageNum: 1,
    pageSize: 10
  },
  api: getRiskCheckTaskList
})

const headerSearch = (row) => {
  requestData.data.keyLike = row.searchValue
  requestData.data.pageNum = 1
  dataList.value = []
  requestData.data = { ...requestData.data }
}

const resetFilterConditions = () => {
  requestData.data.keyLike = ''
  requestData.data.pageNum = 1
  dataList.value = []
  if (filterHeaderRef.value) {
    filterHeaderRef.value.resetFilters()
  }
  requestData.data = { ...requestData.data }
}

const setData = (res) => {
  if (res.isRefresh) {
    dataList.value = [...res.list]
  } else {
    dataList.value.push(...res.list)
  }
  needRefresh.value = false
}

const goDetail = (item) => {
  router.push({
    path: '/riskCheck/taskDetail',
    query: { id: item.id }
  })
}

const goAudit = () => {
  router.push({ path: '/riskCheck/auditList' })
}

// progress 后端返回 "75.00%" 字符串；缺省时用完成数/总数兜底
const progressPercent = (item) => {
  if (item.progress) {
    const rate = parseFloat(item.progress)
    if (!isNaN(rate)) {
      return Math.min(Math.max(rate, 0), 100)
    }
  }
  const total = item.totalVehicleCount || 0
  if (total <= 0) {
    return 0
  }
  return Math.min(Math.round(((item.finishedVehicleCount || 0) * 100) / total), 100)
}

const progressRate = (item) => {
  const rate = progressPercent(item)
  return Number.isInteger(rate) ? rate : Math.round(rate)
}

watch(
  () => active.value,
  () => {
    requestData.data.taskStatusList = statusByTab[active.value] ? [statusByTab[active.value]] : []
    requestData.data.pageNum = 1
    dataList.value = []
    requestData.data = { ...requestData.data }
  }
)
</script>

<style lang="scss" scoped>
.audit-entry {
  font-size: 14px;
  color: #0a0;
  padding-right: 8px;
}

.common-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 12px;

  .tab-content {
    width: 100%;
    overflow-x: auto;
    height: 42px;
    overflow-y: hidden;
  }
}

.task-card {
  background: #fff;
  border-radius: 7px;
  margin-top: 12px;
  padding: 12px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;

    .title-wrap {
      flex: 1;
      min-width: 0;
    }

    .card-title {
      font-family: 'PingFang SC', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: #191a1b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-dealer {
      margin-top: 4px;
      font-size: 12px;
      color: #545454;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .lock-label {
      flex-shrink: 0;
      font-size: 13px;
      font-weight: 500;

      &.lock-red {
        color: #ee0a24;
      }

      &.lock-green {
        color: #0a0;
      }
    }
  }

  .card-desc {
    margin-top: 6px;
    font-size: 12px;
    color: #888;
    line-height: 18px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  .card-audit {
    margin-top: 8px;
    font-size: 12px;
    color: #545454;
  }

  .card-progress {
    margin-top: 8px;

    .progress-text-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;

      .progress-count {
        font-size: 12px;
        color: #191a1b;
      }

      .progress-rate {
        font-size: 14px;
        font-weight: 500;
        color: #0a0;
      }
    }

    .progress-bar {
      height: 6px;
      border-radius: 3px;
    }
  }
}
</style>
