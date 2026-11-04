<template>
  <div class="audit-detail-content">
    <van-loading color="#00AA00" class="loading-area" v-if="isFetch" />
    <template v-else>
      <!-- 车辆信息卡 -->
      <div class="vehicle-card">
        <div class="info-row">
          <span class="info-label">VIN</span>
          <span class="info-value">{{ detail.vin || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">门店名称</span>
          <span class="info-value">{{ detail.storeName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">车型名称</span>
          <span class="info-value">{{ detail.modelName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">年款名称</span>
          <span class="info-value">{{ detail.yearTypeName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">外观名称</span>
          <span class="info-value">{{ detail.exteriorName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">内饰名称</span>
          <span class="info-value">{{ detail.interiorName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">车辆类型</span>
          <span class="info-value">{{ detail.vehicleTypeLabel || statusVehicleType[detail.vehicleType] || '-' }}</span>
        </div>
      </div>

      <!-- 排查方法卡（主任务下发，只读展示） -->
      <div class="method-card" v-if="detail.checkMethod">
        <div class="card-title">排查方法</div>
        <div class="method-content">{{ detail.checkMethod }}</div>
        <template v-if="methodFiles.length">
          <div class="method-file" v-for="f in methodFiles" :key="f.id" @click="previewFile(f)">
            {{ f.name }}
          </div>
        </template>
      </div>

      <!-- 排查结果卡：门店提交的排查附件（businessId = detailId）+ 补充说明 -->
      <div class="result-card">
        <div class="card-title">排查结果</div>
        <div class="img-grid" v-if="imageFiles.length">
          <van-image
            v-for="(f, index) in imageFiles"
            :key="f.id || index"
            class="img-item"
            fit="cover"
            :src="f.url || f.fileUrl"
            @click="previewImage(index)"
          />
        </div>
        <div class="empty-text" v-if="!fileList.length">暂无排查附件</div>
        <div class="note-block" v-if="detail.checkResultNote">
          <p class="note-title">排查说明</p>
          <p class="note-content">{{ detail.checkResultNote }}</p>
        </div>
      </div>
    </template>

    <!-- 底部审核按钮：可见 = 后端 buttonControl.approveButton（canApprove 同源，仅 checkStatus=审核中(60) 为 true）；
         审核动作权限由后端 approve 接口 @ResourcePermission 把关 -->
    <div class="footer-bar" v-if="canAudit">
      <ais-button class="footer-btn" round color="#EE0A24" @click="onReject">不通过</ais-button>
      <ais-button class="footer-btn" round color="#00AA00" :loading="passLoading" @click="onPass">通过</ais-button>
    </div>

    <!-- 不通过：审核说明弹窗（G11 必填 / G12 ≤200字） -->
    <van-dialog
      v-model:show="showReject"
      title="审核说明"
      show-cancel-button
      :before-close="onRejectConfirm"
    >
      <van-field
        v-model="auditOpinion"
        type="textarea"
        rows="3"
        autosize
        maxlength="200"
        show-word-limit
        placeholder="不通过时必填，请填写审核说明"
        class="reject-field"
      />
    </van-dialog>

    <!-- 视频预览 -->
    <van-popup v-model:show="showVideo" position="center" round class="video-popup">
      <video v-if="showVideo" :src="videoUrl" controls autoplay class="video-player"></video>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast, showSuccessToast, showImagePreview } from 'vant'
import AisButton from '@/components/AisButton.vue'
import { getRiskCheckAuditDetail, approveRiskCheckAudit } from '@/api/riskCheck'
import { getFileList } from '@/libs/api/fileConfig'

defineOptions({
  name: 'RiskCheckAuditDetailView'
})

const router = useRouter()
const route = useRoute()
// 审核记录ID（列表页卡片点击带过来，即 detail 接口的入参 id）
const auditRecordId = ref(route.query.id || '')

const isFetch = ref(true)
const detail = ref({})
const fileList = ref([])
const methodFiles = ref([])

const passLoading = ref(false)
const showReject = ref(false)
const auditOpinion = ref('')
const showVideo = ref(false)
const videoUrl = ref('')

// 🔑 后端按审核记录状态算出的按钮可见性（detail 接口下发 buttonControl）：
//    仅 checkStatus=审核中(60) 时 approveButton=true（后端 canApprove 与写侧 approve 守卫同源）
// 已排查(110)/已驳回(160) 只读；审核动作权限由后端 approve 接口 @ResourcePermission 把关
const canAudit = computed(() => !!detail.value.buttonControl?.approveButton)

// 车辆类型兜底文案（正常走后端 @DictEnumType 生成的 vehicleTypeLabel）
const statusVehicleType = { 1: '商品车', 3: '展车', 10: '试驾车' }

// 排查附件里的图片（截图排查结果区为图片九宫格）
const imageFiles = computed(() => fileList.value.filter((f) => fileKind(f) === 'image'))

onMounted(() => {
  getDetail()
})

const getDetail = () => {
  isFetch.value = true
  getRiskCheckAuditDetail({ id: auditRecordId.value })
    .then((res) => {
      if (res.code === 200 && res.data && res.data.id) {
        detail.value = res.data
        loadAttachments()
        loadMethodFiles()
      } else {
        showFailToast(res.msg || '审核记录不存在')
      }
    })
    .catch(() => {})
    .finally(() => {
      isFetch.value = false
    })
}

// 排查附件：businessId = 明细ID（Resp.detailId），明细查不到时为空串则不查
const loadAttachments = () => {
  if (!detail.value.detailId) {
    fileList.value = []
    return Promise.resolve()
  }
  return getFileList({ businessId: detail.value.detailId })
    .then((res) => {
      const list = Array.isArray(res) ? res : (res.code === 200 ? res.data || [] : [])
      fileList.value = list.map((f) => ({
        ...f,
        name: f.fileName || (f.fileUrl || '').split('/').pop()?.split('?')[0] || '未命名文件'
      }))
    })
    .catch(() => {
      fileList.value = []
    })
}

// 排查方法附件：businessId = 任务ID（与 TaskDetailView 口径一致）
const loadMethodFiles = () => {
  if (!detail.value.checkTaskId) {
    methodFiles.value = []
    return Promise.resolve()
  }
  return getFileList({ businessId: detail.value.checkTaskId })
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

// ==================== 返回列表 ====================
// 顶部导航栏回退修复（安卓/iOS webview）：baseLayout.handleBack 默认依赖 window.history.length 判断，
// webview 直开/容器重置历史栈时失真，原生桥缺失时静默无响应。这里显式接管回退：
// SPA 内有上一页（vue-router 写入的 history.state.back）→ router.back() 后退到列表页（同 PDI DetailView 的 router.go(-1)）；
// 直开详情页无历史栈 → replace 到列表页兜底，保证点回退总能回到列表页。
const goBackList = () => {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.replace({ path: '/riskCheck/auditList' })
  }
}

// baseLayout.handleBack 约定：页面组件暴露 onBeforeBack 即接管回退，返回 false 跳过默认行为
const onBeforeBack = () => {
  goBackList()
  return false
}
defineExpose({ onBeforeBack })

// ==================== 审核动作 ====================
const onPass = () => {
  doApprove({ auditRecordId: auditRecordId.value, pass: true })
}

const onReject = () => {
  auditOpinion.value = ''
  showReject.value = true
}

const onRejectConfirm = (action) => {
  if (action !== 'confirm') {
    showReject.value = false
    return
  }
  // G11：不通过时审核说明必填
  if (!auditOpinion.value.trim()) {
    showFailToast('请填写审核说明')
    return Promise.resolve(false)
  }
  doApprove({
    auditRecordId: auditRecordId.value,
    pass: false,
    auditOpinion: auditOpinion.value.trim()
  })
  return Promise.resolve(false)
}

const doApprove = (data) => {
  passLoading.value = true
  approveRiskCheckAudit(data)
    .then((res) => {
      if (res.code === 200) {
        showSuccessToast(data.pass ? '审核通过' : '已驳回')
        // 审核完成后回列表：列表页 keepAlive 不重新挂载，
        // 打 needRefresh 标记，由列表页 onActivated 读取后强制重新查询
        sessionStorage.setItem('needRefresh', '1')
        router.back()
      } else {
        showFailToast(res.msg || '提交失败')
      }
    })
    .catch(() => {})
    .finally(() => {
      passLoading.value = false
    })
}

// ==================== 附件查看 ====================
const fileKind = (f) => {
  const ext = String(f.fileType || '').toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 'image'
  if (['mp4', 'mov', 'avi'].includes(ext)) return 'video'
  return 'other'
}

const previewImage = (index) => {
  showImagePreview(imageFiles.value.map((f) => f.url || f.fileUrl), index)
}

const previewFile = (f) => {
  const kind = fileKind(f)
  if (kind === 'image') {
    showImagePreview([f.url || f.fileUrl])
  } else if (kind === 'video') {
    videoUrl.value = f.url || f.fileUrl
    showVideo.value = true
  } else {
    window.open(f.url || f.fileUrl)
  }
}
</script>

<style lang="scss" scoped>
.audit-detail-content {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  padding-bottom: 76px;
}

.vehicle-card,
.method-card,
.result-card {
  background: #fff;
  padding: 12px;
  margin: 8px;
  border-radius: 8px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  padding: 5px 0;
  font-size: 13px;
  line-height: 18px;

  .info-label {
    flex-shrink: 0;
    width: 70px;
    color: #888;
  }

  .info-value {
    flex: 1;
    color: #191a1b;
    word-break: break-all;
  }
}

.card-title {
  font-size: 15px;
  font-weight: 500;
  color: #191a1b;
  margin-bottom: 8px;
}

.method-card {
  .method-content {
    font-size: 13px;
    color: #191a1b;
    line-height: 22px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .method-file {
    margin-top: 6px;
    font-size: 13px;
    color: #0a0;
    word-break: break-all;
  }
}

.result-card {
  .img-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .img-item {
      width: calc((100% - 16px) / 3);
      height: 96px;
      border-radius: 6px;
      overflow: hidden;
    }
  }

  .empty-text {
    font-size: 13px;
    color: #888;
    text-align: center;
    padding: 12px 0;
  }

  .note-block {
    margin-top: 8px;

    .note-title {
      font-size: 12px;
      color: #888;
      margin-bottom: 2px;
    }

    .note-content {
      font-size: 13px;
      color: #191a1b;
      line-height: 20px;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 12px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);

  .footer-btn {
    flex: 1;
    height: 40px;
    font-size: 15px;
  }
}

.reject-field {
  margin: 8px 12px;
  background: #fcfbfb;
  border-radius: 6px;
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
  height: 80vh;
}
</style>
