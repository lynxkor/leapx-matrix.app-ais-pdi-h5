<template>
  <div class="vehicle-detail-content">
    <van-loading color="#00AA00" class="loading-area" v-if="isFetch" />
    <template v-else>
      <!-- 车辆信息卡 -->
      <div class="vehicle-card">
        <div class="card-header">
          <div class="card-vin">{{ detail.vin || '-' }}</div>
          <span :class="['status-tag', statusClass]">
            {{ detail.checkStatusLabel || statusTextMap[detail.checkStatus] || '-' }}
          </span>
        </div>
        <div class="card-subtitle">{{ detail.materialsDesc || detail.modelName || '-' }}</div>
        <van-row class="card-info">
          <van-col span="12" class="card-info-col">
            <p class="card-info-title">车型名称</p>
            <p class="card-info-des">{{ detail.modelName || '-' }}</p>
          </van-col>
          <van-col span="12" class="card-info-col">
            <p class="card-info-title">年款</p>
            <p class="card-info-des">{{ detail.yearTypeName || '-' }}</p>
          </van-col>
          <van-col span="12" class="card-info-col">
            <p class="card-info-title">外观</p>
            <p class="card-info-des">{{ detail.exteriorName || '-' }}</p>
          </van-col>
          <van-col span="12" class="card-info-col">
            <p class="card-info-title">内饰</p>
            <p class="card-info-des">{{ detail.interiorName || '-' }}</p>
          </van-col>
          <van-col span="12" class="card-info-col">
            <p class="card-info-title">车辆类型</p>
            <p class="card-info-des">{{ detail.vehicleTypeLabel || '-' }}</p>
          </van-col>
          <van-col span="12" class="card-info-col">
            <p class="card-info-title">锁定状态</p>
            <p class="card-info-des">{{ detail.lockStatusLabel || '-' }}</p>
          </van-col>
          <van-col span="12" class="card-info-col" v-if="detail.checkTime">
            <p class="card-info-title">完成排查时间</p>
            <p class="card-info-des">{{ detail.checkTime }}</p>
          </van-col>
        </van-row>

        <div class="note-block" v-if="detail.checkResultNote">
          <p class="card-info-title">排查说明</p>
          <p class="note-content">{{ detail.checkResultNote }}</p>
        </div>
      </div>

      <!-- 排查方法（主任务下发，只读展示） -->
      <div class="method-card" v-if="detail.checkMethod">
        <div class="card-title">排查方法</div>
        <div class="method-content">{{ detail.checkMethod }}</div>
      </div>

      <!-- 提交排查结果（仅 待排查10 / 已驳回160 可提交；任务进行中校验由后端 G7 守卫兜底） -->
      <div class="submit-card" v-if="canSubmit">
        <div class="card-title">提交排查结果</div>
        <van-field
          v-model="checkResultNote"
          type="textarea"
          rows="3"
          autosize
          maxlength="500"
          show-word-limit
          placeholder="请填写门店排查补充说明"
          class="note-field"
        />
        <div class="attach-section">
          <div class="attach-header">
            <!-- G18：提交排查结果附件必填 -->
            <span class="attach-label"><i class="required-star">*</i>排查附件</span>
            <van-uploader :after-read="afterRead" multiple>
              <ais-button plain size="small" :loading="uploading">上传附件</ais-button>
            </van-uploader>
          </div>
          <div class="file-item" v-for="(f, index) in fileList" :key="f.id || index">
            <span :class="['file-icon', fileKind(f)]">{{ fileKindText(f) }}</span>
            <span class="file-name">{{ f.name }}</span>
            <van-icon name="delete-o" class="file-delete" @click="removeFile(f, index)" />
          </div>
        </div>
        <div class="footer">
          <ais-button type="primary" round block :loading="submitLoading" @click="doSubmit">提交</ais-button>
        </div>
      </div>

      <!-- 已提交：附件只读展示 -->
      <div class="submit-card" v-else>
        <div class="card-title">排查附件</div>
        <div class="empty-text" v-if="!fileList.length">暂无附件</div>
        <div class="file-item" v-for="(f, index) in fileList" :key="f.id || index" @click="previewFile(f)">
          <span :class="['file-icon', fileKind(f)]">{{ fileKindText(f) }}</span>
          <span class="file-name">{{ f.name }}</span>
          <span class="file-action">查看</span>
        </div>
      </div>
    </template>

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
import { getRiskCheckVehicleDetail, submitRiskCheckResult } from '@/api/riskCheck'
import { getFileList, uploadFile, bindFile, deleteAttachmentConfig } from '@/libs/api/fileConfig'

defineOptions({
  name: 'RiskCheckVehicleDetailView'
})

const route = useRoute()
const router = useRouter()
// 明细ID（附件 businessId 同值）+ 子任务ID（detailVin 详情定位用），VIN 由详情接口回显
const detailId = ref(route.query.id || '')
const childTaskId = ref(route.query.taskId || '')

const isFetch = ref(true)
const detail = ref({})

// 🔧 待确认：排查提交附件的 attachType 编码后端/文件服务未约定，先用固定值占位，
// 若文件服务要求走配置（attachmentConfig），改为 getUploadConfig(code) 拉取
const RISK_CHECK_ATTACH_TYPE = 'riskCheckResult'
const fileList = ref([])
const uploading = ref(false)
const submitLoading = ref(false)
const checkResultNote = ref('')
const showVideo = ref(false)
const videoUrl = ref('')

// 排查状态：10待排查 60审核中 110已排查 160已驳回 210取消排查
const statusTextMap = { 10: '待排查', 60: '审核中', 110: '已排查', 160: '已驳回', 210: '取消排查' }
const statusClassMap = { 10: 'pending', 60: 'auditing', 110: 'done', 160: 'reject', 210: 'cancel' }

const canSubmit = computed(() => detail.value.checkStatus === 10 || detail.value.checkStatus === 160)
const statusClass = computed(() => statusClassMap[detail.value.checkStatus] || 'pending')

onMounted(() => {
  getDetail()
})

// 详情走后端 detailVin 专用接口：子任务ID + 明细ID 定位（不再借分页接口按 VIN 兜圈）
// 🔍 后端 getByChildTaskIdAndVin(childTaskId, detailId) 两参任一为空直接返回 null → 空对象
const getDetail = () => {
  isFetch.value = true
  getRiskCheckVehicleDetail({
    checkChildTaskId: childTaskId.value,
    id: detailId.value
  })
    .then((res) => {
      if (res.code === 200 && res.data && res.data.id) {
        detail.value = res.data
        if (detail.value.checkResultNote) {
          checkResultNote.value = detail.value.checkResultNote
        }
        loadAttachments()
      } else {
        showFailToast(res.msg || '车辆明细不存在')
      }
    })
    .catch(() => {})
    .finally(() => {
      isFetch.value = false
    })
}

// 附件列表响应字段对齐 sales-front AisAttachment：id/fileName/fileUrl/fileType/fileSize
const loadAttachments = () => {
  return getFileList({ businessId: detailId.value })
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

// ==================== 附件上传（三步：uploadMultipartFile → addOrUpdate 绑 businessId → 刷新列表） ====================
const afterRead = async(files) => {
  const items = Array.isArray(files) ? files : [files]
  uploading.value = true
  for (const item of items) {
    item.status = 'uploading'
    item.message = '上传中'
    try {
      const formData = new FormData()
      formData.append('file', item.file)
      const uploadRes = await uploadFile(formData)
      const data = (uploadRes && uploadRes.data) || {}
      // 绑定业务：businessId = 排查车辆明细ID（与后端 VehicleRiskCheckResultSubmitReq 注释一致）
      await bindFile({
        fileId: data.id,
        fileName: data.originalFilename || data.filename,
        fileUrl: data.url,
        fileSize: data.size,
        fileType: data.ext,
        attachType: RISK_CHECK_ATTACH_TYPE,
        businessId: detailId.value
      })
      item.status = 'done'
      await loadAttachments()
    } catch {
      item.status = 'failed'
      item.message = '上传失败'
      showFailToast('附件上传失败，请重试')
    }
  }
  uploading.value = false
}

const removeFile = (f, index) => {
  if (!f.id) {
    fileList.value.splice(index, 1)
    return
  }
  deleteAttachmentConfig([f.id])
    .then(() => {
      fileList.value.splice(index, 1)
    })
    .catch(() => {
      showFailToast('删除失败，请重试')
    })
}

// ==================== 提交排查结果 ====================
const doSubmit = () => {
  if (!checkResultNote.value.trim()) {
    showFailToast('请填写排查说明')
    return
  }
  // G18：附件必填
  if (!fileList.value.length) {
    showFailToast('请上传排查附件')
    return
  }
  submitLoading.value = true
  submitRiskCheckResult({
    detailId: detailId.value,
    checkResultNote: checkResultNote.value.trim()
  })
    .then((res) => {
      if (res.code === 200) {
        showSuccessToast('提交成功')
        // 刷新状态（提交后 → 审核中60 或 无需审核直接已排查110）
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

// ==================== 返回列表 ====================
// 顶部导航栏回退修复（安卓/iOS webview）：baseLayout.handleBack 默认依赖 window.history.length 判断，
// webview 直开/容器重置历史栈时失真，原生桥缺失时静默无响应。这里显式接管回退：
// SPA 内有上一页（vue-router 4 写入的 history.state.back）→ router.back() 后退到列表页（同 PDI DetailView 的 router.go(-1)）；
// 直开详情页无历史栈 → replace 到列表页兜底，保证点回退总能回到列表页。
const goBackList = () => {
  if (window.history.state?.back) {
    router.back()
  } else {
    // 兜底回任务详情（车辆清单来源页，childTaskId 与入口 query.id 同值）
    router.replace({ path: '/riskCheck/taskDetail', query: { id: childTaskId.value }})
  }
}

// baseLayout.handleBack 约定：页面组件暴露 onBeforeBack 即接管回退，返回 false 跳过 default 行为
const onBeforeBack = () => {
  goBackList()
  return false
}
defineExpose({ onBeforeBack })

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
.vehicle-detail-content {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  padding-bottom: 12px;
}

.vehicle-card,
.submit-card,
.method-card {
  background: #fff;
  padding: 12px;
  margin: 8px;
  border-radius: 8px;
}

.method-card {
  .card-title {
    font-size: 15px;
    font-weight: 500;
    color: #191a1b;
    margin-bottom: 8px;
  }

  .method-content {
    font-size: 13px;
    color: #191a1b;
    line-height: 22px;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.vehicle-card {
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

  .note-block {
    margin-top: 8px;

    .card-info-title {
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

.submit-card {
  .card-title {
    font-size: 15px;
    font-weight: 500;
    color: #191a1b;
    margin-bottom: 8px;
  }

  .note-field {
    background: #fcfbfb;
    border-radius: 6px;
    padding: 8px;
  }

  .attach-section {
    margin-top: 12px;

    .attach-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .attach-label {
        font-size: 13px;
        color: #191a1b;

        .required-star {
          color: #ee0a24;
          font-style: normal;
          margin-right: 2px;
        }
      }
    }
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

    .file-delete {
      flex-shrink: 0;
      margin-left: 8px;
      font-size: 16px;
      color: #ee0a24;
    }
  }

  .empty-text {
    font-size: 13px;
    color: #888;
    text-align: center;
    padding: 12px 0;
  }

  .footer {
    margin-top: 16px;
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
  height: 80vh;
}
</style>
