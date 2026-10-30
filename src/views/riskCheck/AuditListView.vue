<template>
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
      @setData="setData"
    >
      <list-item v-for="(item, index) in auditList" :key="index" :dataItem="item" :active="active">
        <div class="audit-status">
          <span :class="['status-dot', item.checkStatus === 110 ? 'done' : (item.checkStatus === 160 ? 'reject' : 'pending')]"></span>
          <span class="status-text">{{ item.checkStatusDesc }}</span>
        </div>
      </list-item>
    </refresh-list>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import RefreshList from '@/libs/components/RefreshList.vue'
import ListItem from '@/components/ListItem.vue'
import { getRiskCheckAuditPage } from '@/api/riskCheck'

defineOptions({
  name: 'RiskCheckAuditListView'
})

const active = ref(0)
const needRefresh = ref(false)
const auditList = ref([])
const scrollEle = ref(null)
const refreshListRef = ref(null)
const tabList = ['待审核', '已审核']
// 待审核 = 审核中(60)；已审核 = 已排查(110) / 已驳回(160)
const statusByTab = [['60'], ['110', '160']]

const requestData = reactive({
  data: {
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

watch(
  () => active.value,
  () => {
    requestData.data.checkStatusList = statusByTab[active.value]
    requestData.data.pageNum = 1
    auditList.value = []
    requestData.data = { ...requestData.data }
  }
)
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

.audit-status {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #888;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
    &.pending { background: #ed8b3d; }
    &.done { background: #0a0; }
    &.reject { background: #ee0a24; }
  }
}
</style>
