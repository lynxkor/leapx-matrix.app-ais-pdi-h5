<template>
  <div class="detail-view-content">
    <van-loading color="#00AA00" class="loading-area" v-if="isFetch" />
    <template v-else>
      <!-- 任务信息 -->
      <div class="task-info-card">
        <div class="info-row">
          <span class="label">任务状态</span>
          <span class="value">{{ task.taskStatusDesc || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">门店进度</span>
          <span class="value highlight">{{ task.progress || '0.00' }}%</span>
          <span class="value sub">{{ task.storeFinishedCount || 0 }}/{{ task.storeTotalCount || 0 }}</span>
        </div>
        <div class="info-row">
          <span class="label">排查车辆版本</span>
          <span class="value">{{ task.vehicleSystemVersion || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">关联门店类别</span>
          <span class="value">{{ storeCategoryText }}</span>
        </div>
      </div>

      <!-- 车辆清单 -->
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
          :has-no-data="vehicleList.length === 0"
          @setData="setData"
        >
          <list-item v-for="(item, index) in vehicleList" :key="index" :dataItem="item" :active="active">
            <div class="vehicle-status">
              <span :class="['status-dot', item.checkStatus === 110 ? 'done' : (item.checkStatus === 160 ? 'reject' : 'pending')]"></span>
              <span class="status-text">{{ item.checkStatusDesc }}</span>
              <span v-if="item.lockStatus === 10" class="lock-tag">已锁定</span>
            </div>
            <ais-button
              v-if="item.checkStatus === 10 || item.checkStatus === 160"
              type="primary" plain round
              @click="openSubmit(item)"
            >提交排查</ais-button>
          </list-item>
        </refresh-list>
      </div>
    </template>

    <!-- 提交排查结果弹窗 -->
    <van-popup v-model:show="showSubmit" position="bottom" round :style="{ height: '60%' }">
      <div class="submit-popup">
        <div class="popup-title">提交排查结果</div>
        <div class="popup-vin">{{ currentVehicle.vin }}</div>
        <van-field
          v-model="submitForm.checkResultNote"
          label="排查说明"
          type="textarea"
          rows="3"
          autosize
          placeholder="请填写门店排查补充说明"
        />
        <div class="attachment-tip">
          📎 附件上传（G18 要求必填）：
          <span class="pending">组件待平台 AisAttachment 接入（#122）</span>
        </div>
        <div class="popup-footer">
          <ais-button plain @click="showSubmit = false">取消</ais-button>
          <ais-button @click="doSubmit" :loading="submitLoading">提交</ais-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import RefreshList from '@/libs/components/RefreshList.vue'
import ListItem from '@/components/ListItem.vue'
import AisButton from '@/components/AisButton.vue'
import { getRiskCheckTaskDetail, getRiskCheckVehiclePage, submitRiskCheckResult } from '@/api/riskCheck'

defineOptions({
  name: 'RiskCheckTaskDetailView'
})

const route = useRoute()
const taskId = ref(route.query.id || '')
const isFetch = ref(true)
const task = ref({})
const active = ref(0)
const needRefresh = ref(false)
const vehicleList = ref([])
const requestData = reactive({
  data: {
    checkTaskId: taskId.value,
    checkStatusList: [],
    pageNum: 1,
    pageSize: 10
  },
  api: getRiskCheckVehiclePage
})
const tabList = ['全部', '待排查', '已排查', '已驳回']
// 全部=空；待排查=10；已排查=110；已驳回=160
const statusByTab = ['', '10', '110', '160']

const scrollEle = ref(null)
const refreshListRef = ref(null)

const showSubmit = ref(false)
const submitLoading = ref(false)
const currentVehicle = ref({})
const submitForm = reactive({ detailId: '', checkResultNote: '' })

const storeCategoryText = computed(() => {
  // store_category: 10=仅销售门店 60=仅交付门店
  if (task.value.storeCategory === 10) return '仅销售门店'
  if (task.value.storeCategory === 60) return '仅交付门店'
  return '全部门店'
})

onMounted(() => {
  getDetail()
})

const getDetail = () => {
  isFetch.value = true
  getRiskCheckTaskDetail({ id: taskId.value })
    .then((res) => {
      if (res.code === 200 && res.data) {
        task.value = res.data
      } else {
        showFailToast(res.msg || '任务不存在')
      }
    })
    .catch(() => {})
    .finally(() => {
      isFetch.value = false
    })
}

const setData = (res) => {
  if (res.isRefresh) {
    vehicleList.value = [...res.list]
  } else {
    vehicleList.value.push(...res.list)
  }
  needRefresh.value = false
}

const openSubmit = (item) => {
  currentVehicle.value = item
  submitForm.detailId = item.id
  submitForm.checkResultNote = ''
  showSubmit.value = true
}

const doSubmit = () => {
  submitLoading.value = true
  submitRiskCheckResult({
    detailId: submitForm.detailId,
    checkResultNote: submitForm.checkResultNote,
    vehicleSystemVersion: task.value.vehicleSystemVersion
  })
    .then((res) => {
      if (res.code === 200) {
        showSuccessToast('提交成功')
        showSubmit.value = false
        // 刷新车辆列表
        vehicleList.value = []
        requestData.data.pageNum = 1
        requestData.data = { ...requestData.data }
        getDetail()
      } else {
        showFailToast(res.msg || '提交失败')
      }
    })
    .catch(() => {})
    .finally(() => {
      submitLoading.value = false
    })
}

watch(
  () => active.value,
  () => {
    requestData.data.checkStatusList = statusByTab[active.value] ? [statusByTab[active.value]] : []
    requestData.data.pageNum = 1
    vehicleList.value = []
    requestData.data = { ...requestData.data }
  }
)
</script>

<style lang="scss" scoped>
.detail-view-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.task-info-card {
  background: #fff;
  padding: 12px;
  margin: 8px;
  border-radius: 8px;

  .info-row {
    display: flex;
    align-items: center;
    padding: 4px 0;
    font-size: 13px;

    .label {
      color: #888;
      width: 96px;
    }

    .value {
      color: #191a1b;

      &.highlight {
        color: #ed8b3d;
        font-weight: 500;
      }

      &.sub {
        margin-left: 8px;
        color: #888;
      }
    }
  }
}

.tab-content {
  background: #fff;
  height: 42px;
}

.common-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.vehicle-status {
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

  .lock-tag {
    margin-left: 8px;
    color: #ee0a24;
    border: 1px solid #ee0a24;
    border-radius: 4px;
    padding: 0 4px;
    font-size: 11px;
  }
}

.submit-popup {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;

  .popup-title {
    font-size: 16px;
    font-weight: 600;
    text-align: center;
  }

  .popup-vin {
    font-size: 13px;
    color: #888;
    text-align: center;
    margin: 8px 0;
  }

  .attachment-tip {
    font-size: 12px;
    color: #888;
    margin: 12px 0;

    .pending {
      color: #ed8b3d;
    }
  }

  .popup-footer {
    margin-top: auto;
    display: flex;
    gap: 12px;

    :deep(.footer-btn) {
      flex: 1;
    }
  }
}

.loading-area {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
