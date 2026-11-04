<template>
  <div class="detail-view-content">
    <van-loading color="#00AA00" class="loading-area" v-if="isFetch" />
    <template v-else>
      <!-- VIN 搜索栏：输入 VIN 查询车辆（后端 detail/page vinLike 模糊匹配） -->
      <div class="search-area">
        <van-search
          v-model="vinKeyword"
          placeholder="输入VIN查询车辆"
          @search="onVinSearch"
          @clear="onVinClear"
        />
      </div>

      <!-- 任务信息卡 -->
      <div class="task-info-card">
        <div class="task-name-row">
          <div class="task-name">{{ task.taskName || '-' }}</div>
          <!-- 是否截车：1锁定=红字 0不锁定=绿字，文案取后端 lockVehicleFlagLabel -->
          <span v-if="task.lockVehicleFlag === 1" class="lock-label lock-red">{{ task.lockVehicleFlagLabel || '锁定' }}</span>
          <span v-else-if="task.lockVehicleFlag === 0" class="lock-label lock-green">{{ task.lockVehicleFlagLabel || '不锁定' }}</span>
        </div>
        <!-- 门店名称：子任务 dealerName（发布时按门店回填） -->
        <div class="info-row">
          <span class="label">门店名称</span>
          <span class="value">{{ task.dealerName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">排查原因</span>
          <span class="value">{{ task.checkReason || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">排查方法</span>
          <span class="value method-text">{{ task.checkMethod || '-' }}</span>
          <span class="method-link" @click="openMethodPopup">查看说明</span>
        </div>
        <div class="info-row">
          <span class="label">任务要求</span>
          <span class="value">{{ task.taskRequirement || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">审核方式</span>
          <span class="value">{{ task.auditTypeLabel || '-' }}</span>
        </div>
        <div class="progress-block">
          <div class="progress-text-row">
            <span class="progress-count">完成 {{ finishedCount }}/{{ totalCount }} 辆</span>
            <!-- 完成进度 = 完成数量/车辆数量*100%，四舍五入保留整数（前端重算，不依赖后端两位小数 progress） -->
            <span class="progress-rate">{{ progressPercent }}%</span>
          </div>
          <van-progress
            class="progress-bar"
            :percentage="progressPercent"
            color="#00AA00"
            track-color="#e5e5e5"
            :show-pivot="false"
          />
        </div>
      </div>

      <!-- 车辆清单状态页签（排查状态 5 态 + 全部） -->
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
          :show-reset-button="!!requestData.data.vinLike"
          @setData="setData"
          @resetFilters="resetFilterConditions"
        >
          <div
            class="vehicle-card"
            v-for="item in vehicleList"
            :key="item.id"
            @click="goVehicleDetail(item)"
          >
            <div class="card-header">
              <div class="card-vin">{{ item.vin }}</div>
              <span :class="['status-tag', statusClass(item.checkStatus)]">
                {{ item.checkStatusLabel || statusText(item.checkStatus) }}
              </span>
            </div>
            <div class="card-subtitle">{{ item.modelName || '-'}}•{{ item.yearTypeName || '-'}}•{{ item.exteriorName}}•{{ item.interiorName || '-'}}•{{ item.vehicleTypeLabel || '-' }}</div>
          </div>
        </refresh-list>
      </div>
    </template>

    <!-- 排查方法说明弹窗：文本 + 附件（word/PDF/MP4 可查看） -->
    <van-popup v-model:show="showMethod" position="bottom" round :style="{ height: '70%' }">
      <div class="method-popup">
        <div class="popup-title">排查方法</div>
        <div class="method-content">{{ task.checkMethod || '-' }}</div>
        <template v-if="methodFiles.length">
          <div class="attach-title">附件（{{ methodFiles.length }}）</div>
          <div class="file-item" v-for="(f, index) in methodFiles" :key="index" @click="previewFile(f)">
            <span :class="['file-icon', fileKind(f)]">{{ fileKindText(f) }}</span>
            <span class="file-name">{{ f.name }}</span>
            <span class="file-action">查看</span>
          </div>
        </template>
        <div class="popup-footer">
          <ais-button type="primary" round block @click="showMethod = false">关闭</ais-button>
        </div>
      </div>
    </van-popup>

    <!-- 视频预览 -->
    <van-popup v-model:show="showVideo" position="center" round class="video-popup">
      <video v-if="showVideo" :src="videoUrl" controls autoplay class="video-player"></video>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showFailToast, showImagePreview } from 'vant'
import RefreshList from '@/libs/components/RefreshList.vue'
import AisButton from '@/components/AisButton.vue'
import { getRiskCheckTaskDetail, getRiskCheckVehiclePage } from '@/api/riskCheck'
import { getFileList } from '@/libs/api/fileConfig'

defineOptions({
  name: 'RiskCheckTaskDetailView'
})

const router = useRouter()
const route = useRoute()

const taskId = ref(route.query.id || '')
const isFetch = ref(true)
const task = ref({})
const active = ref(0)
const needRefresh = ref(false)
const vehicleList = ref([])
const vinKeyword = ref('')
// 🔑 明细表 check_child_task_id 才是门店子任务ID（发布时 detailedRelatedChildTask 回填），
//    check_task_id 存父任务ID —— 必须用 checkChildTaskId 查，传 checkTaskId 会串任务
const requestData = reactive({
  data: {
    checkChildTaskId: taskId.value,
    // 🔑 VIN 模糊搜索走后端 vinLike（vin 为精确匹配，段码查询用）
    vinLike: '',
    checkStatusList: [],
    pageNum: 1,
    pageSize: 10
  },
  api: getRiskCheckVehiclePage
})

// 排查状态：10待排查 60审核中 110已排查 160已驳回 210取消排查（RiskCheckStatusEnum，code 间隔 50）
const tabList = ['全部', '待排查', '审核中', '已排查', '已驳回', '取消排查']
const statusByTab = ['', 10, 60, 110, 160, 210]
const statusClassMap = { 10: 'pending', 60: 'auditing', 110: 'done', 160: 'reject', 210: 'cancel' }
const statusTextMap = { 10: '待排查', 60: '审核中', 110: '已排查', 160: '已驳回', 210: '取消排查' }

const scrollEle = ref(null)
const refreshListRef = ref(null)

// ==================== 排查方法说明弹窗 ====================
const showMethod = ref(false)
const methodFiles = ref([])
const showVideo = ref(false)
const videoUrl = ref('')

const finishedCount = computed(() => task.value.finishedVehicleCount || 0)
const totalCount = computed(() => task.value.totalVehicleCount || 0)
const progressPercent = computed(() => {
  if (totalCount.value <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((finishedCount.value * 100) / totalCount.value)))
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

const onVinSearch = () => {
  requestData.data.vinLike = vinKeyword.value.trim()
  requestData.data.pageNum = 1
  vehicleList.value = []
  requestData.data = { ...requestData.data }
}

const onVinClear = () => {
  requestData.data.vinLike = ''
  requestData.data.pageNum = 1
  vehicleList.value = []
  requestData.data = { ...requestData.data }
}

const resetFilterConditions = () => {
  vinKeyword.value = ''
  onVinClear()
}

const goVehicleDetail = (item) => {
  router.push({
    path: '/riskCheck/vehicleDetail',
    query: { id: item.id, taskId: taskId.value, vin: item.vin || '' }
  })
}

const statusClass = (code) => statusClassMap[code] || 'pending'
const statusText = (code) => statusTextMap[code] || '-'

// ==================== 附件查看 ====================
const fileKind = (f) => {
  const ext = String(f.fileType || '').toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 'image'
  if (['mp4', 'mov', 'avi'].includes(ext)) return 'video'
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'word'
  return 'other'
}

const fileKindText = (f) => {
  const kind = fileKind(f)
  return { image: '图片', video: '视频', pdf: 'PDF', word: 'Word', other: '文件' }[kind]
}

// 附件列表响应字段对齐 sales-front AisAttachment：id/fileName/fileUrl/fileType/fileSize
const loadMethodFiles = () => {
  // 排查方法附件：businessId = 任务ID；attachType 后端未约定，先仅按 businessId 查（待确认）
  return getFileList({ businessId: taskId.value })
    .then((res) => {
      const list = Array.isArray(res) ? res : (res.code === 200 ? res.data || [] : [])
      methodFiles.value = list.map((f) => ({
        ...f,
        name: f.fileName || (f.fileUrl || '').split('/').pop()?.split('?')[0] || '未命名文件'
      }))
    })
    .catch(() => {
      methodFiles.value = []
    })
}

const openMethodPopup = () => {
  showMethod.value = true
  loadMethodFiles()
}

const previewFile = (f) => {
  const kind = fileKind(f)
  if (kind === 'image') {
    showImagePreview([f.url || f.fileUrl])
  } else if (kind === 'video') {
    videoUrl.value = f.url || f.fileUrl
    showVideo.value = true
  } else {
    // PDF / Word / 其他：新窗口打开原文件
    window.open(f.url || f.fileUrl)
  }
}

// ==================== 返回列表 ====================
// 顶部导航栏回退修复（安卓/iOS webview）：baseLayout.handleBack 默认依赖 window.history.length 判断，
// webview 直开/容器重置历史栈时失真，原生桥缺失时静默无响应。这里显式接管回退：
// SPA 内有上一页（vue-router 写入的 history.state.back）→ router.back() 后退到列表页（同 PDI DetailView 的 router.go(-1)）；
// 直开详情页无历史栈 → replace 到列表页兜底，保证点回退总能回到列表页。
const goBackList = () => {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.replace({ path: '/riskCheck/taskList' })
  }
}

// baseLayout.handleBack 约定：页面组件暴露 onBeforeBack 即接管回退，返回 false 跳过默认行为
const onBeforeBack = () => {
  goBackList()
  return false
}
defineExpose({ onBeforeBack })

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

.search-area {
  background: #fff;

  :deep(.van-search) {
    padding: 8px 12px;
  }
}

.task-info-card {
  background: #fff;
  padding: 12px;
  margin: 8px;
  border-radius: 8px;

  .task-name-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;

    .task-name {
      flex: 1;
      font-size: 16px;
      font-weight: 500;
      color: #191a1b;
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

  .info-row {
    display: flex;
    align-items: flex-start;
    padding: 4px 0;
    font-size: 13px;
    line-height: 18px;

    .label {
      color: #888;
      width: 64px;
      flex-shrink: 0;
    }

    .value {
      color: #191a1b;
      flex: 1;

      &.method-text {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
    }

    .method-link {
      flex-shrink: 0;
      margin-left: 8px;
      color: #0a0;
    }
  }

  .progress-block {
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

.tab-content {
  background: #fff;
  height: 42px;
}

.common-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.vehicle-card {
  background: #fff;
  padding: 12px;
  border-radius: 7px;
  margin-top: 12px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;

    .card-vin {
      flex: 1;
      font-size: 16px;
      font-weight: 500;
      color: #191a1b;
    }

    .status-tag {
      flex-shrink: 0;
      font-size: 12px;
      padding: 1px 8px;
      border-radius: 4px;

      &.pending {
        color: #ed8b3d;
        background: #fdf3ea;
      }

      &.auditing {
        color: #1989fa;
        background: #e8f3fd;
      }

      &.done {
        color: #0a0;
        background: #eaf7ea;
      }

      &.reject {
        color: #ee0a24;
        background: #fdeaea;
      }

      &.cancel {
        color: #969799;
        background: #f2f3f5;
      }
    }
  }

  .card-subtitle {
    margin-top: 4px;
    font-size: 13px;
    color: #545454;
  }

  .card-info {
    box-sizing: border-box;
    background: #fcfbfb;
    margin-top: 8px;
    padding-bottom: 8px;

    .card-info-col {
      font-size: 12px;
      padding: 8px;
      padding-bottom: 0;

      .card-info-title {
        color: #888;
        margin-bottom: 2px;
      }

      .card-info-des {
        color: #545454;
      }
    }
  }
}

.method-popup {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  .popup-title {
    font-size: 16px;
    font-weight: 600;
    text-align: center;
  }

  .method-content {
    flex: 1;
    overflow-y: auto;
    margin-top: 12px;
    font-size: 14px;
    color: #191a1b;
    line-height: 22px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .attach-title {
    margin-top: 12px;
    font-size: 13px;
    font-weight: 500;
    color: #191a1b;
  }

  .file-item {
    display: flex;
    align-items: center;
    padding: 8px 0;

    .file-icon {
      flex-shrink: 0;
      width: 44px;
      text-align: center;
      font-size: 11px;
      color: #fff;
      border-radius: 4px;
      padding: 4px 0;
      margin-right: 8px;

      &.image {
        background: #1989fa;
      }

      &.video {
        background: #ed8b3d;
      }

      &.pdf {
        background: #ee0a24;
      }

      &.word {
        background: #1989fa;
      }

      &.other {
        background: #969799;
      }
    }

    .file-name {
      flex: 1;
      font-size: 13px;
      color: #191a1b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-action {
      flex-shrink: 0;
      margin-left: 8px;
      font-size: 13px;
      color: #0a0;
    }
  }

  .popup-footer {
    margin-top: 12px;
  }
}

.video-popup {
  width: 90%;

  .video-player {
    width: 100%;
    display: block;
  }
}

.loading-area {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
