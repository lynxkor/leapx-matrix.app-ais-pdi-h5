<template>
  <filter-header
    ref="filterHeaderRef"
    :placeholder="'搜索车架号/VIN'"
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
      :has-no-data="auditList.length === 0"
      :show-reset-button="!!requestData.data.vinLike"
      @setData="setData"
      @resetFilters="resetFilterConditions"
    >
      <div
        class="audit-card"
        v-for="(item, index) in auditList"
        :key="index"
        @click="goDetail(item)"
      >
        <div class="card-header">
          <div class="card-vin">{{ item.vin }}</div>
          <span :class="['status-badge', statusClass(item.checkStatus)]">
            {{ item.checkStatusLabel || statusTextMap[item.checkStatus] || '-' }}
          </span>
        </div>
        <div class="card-info">
          <div class="info-row">
            <span class="info-label">任务名称</span>
            <span class="info-value">{{ item.taskName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">门店名称</span>
            <span class="info-value">{{ item.storeName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">提交人</span>
            <span class="info-value">{{ item.submitUserName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">提交时间</span>
            <span class="info-value">{{ item.submitTime || '-' }}</span>
          </div>
        </div>
      </div>
    </refresh-list>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import RefreshList from '@/libs/components/RefreshList.vue'
import FilterHeader from '@/libs/components/FilterHeader.vue'
import { getRiskCheckAuditPage } from '@/api/riskCheck'

defineOptions({
  name: 'RiskCheckAuditListView'
})

const router = useRouter()

const active = ref(0)
const needRefresh = ref(false)
const auditList = ref([])
const scrollEle = ref(null)
const refreshListRef = ref(null)
const filterHeaderRef = ref(null)
const tabList = ['待审核', '已审核']
// 待审核 = 审核中(60)；已审核 = 已排查(110) / 已驳回(160)
const statusByTab = [['60'], ['110', '160']]
// 状态文案兜底（正常走后端 @DictEnumType 生成的 checkStatusLabel）
const statusTextMap = {
  60: '审核中',
  110: '已排查',
  160: '已驳回'
}

const statusClass = (status) => {
  if (status === 60) return 'pending'
  if (status === 160) return 'reject'
  return 'done'
}

const requestData = reactive({
  data: {
    vinLike: '',
    checkStatusList: statusByTab[0],
    pageNum: 1,
    pageSize: 10
  },
  api: getRiskCheckAuditPage
})

const setData = (res) => {
  if (res.isRefresh) {
    auditList.value = [...res.list]
  } else {
    auditList.value.push(...res.list)
  }
  needRefresh.value = false
}

// 点击卡片进审核详情（审核记录ID = detail 接口入参 id）
const goDetail = (item) => {
  router.push({
    path: '/riskCheck/auditDetail',
    query: { id: item.id }
  })
}

const headerSearch = (row) => {
  requestData.data.vinLike = row.searchValue
  requestData.data.pageNum = 1
  auditList.value = []
  requestData.data = { ...requestData.data }
}

const resetFilterConditions = () => {
  requestData.data.vinLike = ''
  requestData.data.pageNum = 1
  auditList.value = []
  if (filterHeaderRef.value) {
    filterHeaderRef.value.resetFilters()
  }
  requestData.data = { ...requestData.data }
}

watch(
  () => active.value,
  () => {
    requestData.data.checkStatusList = statusByTab[active.value]
    requestData.data.pageNum = 1
    auditList.value = []
    requestData.data = { ...requestData.data }
  }
)

// 列表页被 keepAlive 缓存，从审核详情返回不会重新挂载。
// 审核通过/不通过后详情页打 needRefresh 标记，激活时读到标记就强制重新查询
// （照抄 pdi/ListView.vue 惯例：调 RefreshList.reset() 绕开参数相等性短路）
onActivated(() => {
  if (sessionStorage.getItem('needRefresh')) {
    sessionStorage.removeItem('needRefresh')
    auditList.value = []
    refreshListRef.value?.reset()
  }
})
</script>

<style lang="scss" scoped>
.tab-content {
  background: #fff;
  height: 42px;
}

.common-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.audit-card {
  background: #fff;
  padding: 12px;
  border-radius: 7px;
  margin-top: 12px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-vin {
      font-family: 'PingFang SC', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: #191a1b;
    }

    .status-badge {
      flex-shrink: 0;
      margin-left: 8px;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      color: #fff;
      // 审核中
      &.pending {
        background: #ed8b3d;
      }
      // 已排查
      &.done {
        background: #0a0;
      }
      // 已驳回
      &.reject {
        background: #ee0a24;
      }
    }
  }

  .card-info {
    margin-top: 12px;

    .info-row {
      display: flex;
      font-size: 13px;
      line-height: 28px;

      .info-label {
        flex-shrink: 0;
        width: 70px;
        color: #888;
      }

      .info-value {
        flex: 1;
        color: #333;
        word-break: break-all;
      }
    }
  }
}
</style>
