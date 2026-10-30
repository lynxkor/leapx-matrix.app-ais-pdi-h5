<template>
  <filter-header
    ref="filterHeaderRef"
    :placeholder="'搜索任务名称'"
    :search-page-route="''"
    @search="headerSearch"
    :filterList="searchList"
    @filterSearch="filterSearch"
    :showSort="false"
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
      :has-no-data="dataList.length === 0 && requestData.data.taskName !== ''"
      @setData="setData"
      @resetFilters="resetFilterConditions"
    >
      <list-item v-for="(item, index) in dataList" :key="index" :dataItem="item" :active="active">
        <div class="task-progress">
          <span class="progress-text">门店进度 {{ item.progress || '0.00' }}%</span>
          <span class="progress-count">{{ item.storeFinishedCount || 0 }}/{{ item.storeTotalCount || 0 }}</span>
        </div>
        <ais-button type="primary" plain round @click="goDetail(item)">查看车辆</ais-button>
      </list-item>
    </refresh-list>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import FilterHeader from '@/libs/components/FilterHeader.vue'
import RefreshList from '@/libs/components/RefreshList.vue'
import ListItem from '@/components/ListItem.vue'
import AisButton from '@/components/AisButton.vue'
import { getRiskCheckTaskList } from '@/api/riskCheck'

defineOptions({
  name: 'RiskCheckTaskListView'
})

const router = useRouter()
const filterHeaderRef = ref(null)
const refreshListRef = ref(null)
const scrollEle = ref(null)

const tabList = ['全部', '进行中', '已结束']
// 全部=空；进行中=60；已结束=110（任务状态枚举）
const statusByTab = ['', '60', '110']
const active = ref(0)
const needRefresh = ref(false)
const dataList = ref([])
const requestData = reactive({
  data: {
    taskName: '',
    taskStatusList: [],
    pageNum: 1,
    pageSize: 10
  },
  api: getRiskCheckTaskList
})

const searchList = ref([
  {
    title: '任务状态',
    key: 'taskStatus',
    default: '',
    nodeType: 'single',
    options: [
      { label: '进行中', value: '60' },
      { label: '已结束', value: '110' }
    ]
  }
])

onMounted(() => {
  // 初始化
})

const headerSearch = (row) => {
  requestData.data.taskName = row.searchValue
  requestData.data.pageNum = 1
  dataList.value = []
  requestData.data = { ...requestData.data }
}

const resetFilterConditions = () => {
  requestData.data.taskName = ''
  requestData.data.taskStatusList = []
  requestData.data.pageNum = 1
  dataList.value = []
  if (filterHeaderRef.value) {
    filterHeaderRef.value.resetFilters()
  }
  requestData.data = { ...requestData.data }
}

const filterSearch = (obj) => {
  requestData.data.taskStatusList = obj.taskStatus ? [obj.taskStatus] : []
  requestData.data.pageNum = 1
  dataList.value = []
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
    query: { id: item.id, taskName: item.taskName }
  })
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
.common-scroll-content {
  flex: 1;
  overflow-y: auto;

  .tab-content {
    width: 100%;
    overflow-x: auto;
    height: 42px;
    overflow-y: hidden;
  }
}

.task-progress {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #888;

  .progress-text {
    color: #ed8b3d;
    font-weight: 500;
  }

  .progress-count {
    margin-top: 2px;
  }
}
</style>
