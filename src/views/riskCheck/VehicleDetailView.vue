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

        <!-- 审核说明：审核记录表 audit_opinion，由后端 detail/vin 接口按 任务ID + VIN 补查回显 -->
        <div class="note-block" v-if="detail.auditOpinion">
          <p class="card-info-title">审核说明</p>
          <p class="note-content">{{ detail.auditOpinion }}</p>
        </div>
      </div>

      <!-- 排查方法（主任务下发，只读展示；文本 + 附件，附件按 checkTaskId 查） -->
      <div class="method-card" v-if="detail.checkMethod || methodFiles.length">
        <div class="card-title">排查方法</div>
        <div class="method-content" v-if="detail.checkMethod">{{ detail.checkMethod }}</div>
        <template v-if="methodFiles.length">
          <div class="attach-title">排查方法附件（{{ methodFiles.length }}）</div>
          <div class="file-item" v-for="(f, index) in methodFiles" :key="f.id || index" @click="previewFile(f)">
            <span :class="['file-icon', fileKind(f)]">{{ fileKindText(f) }}</span>
            <span class="file-name">{{ f.name }}</span>
            <span class="file-action">查看</span>
          </div>
        </template>
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
            <van-uploader
              v-if="!isAndroid"
              :after-read="afterRead"
              :before-read="beforeRead"
              :accept="acceptAttr"
              multiple
            >
              <ais-button plain size="small" :loading="uploading">上传附件</ais-button>
            </van-uploader>
            <!-- 安卓原生容器：vant uploader 的 opacity:0 隐藏 input 在安卓 WebView 上点击不派发
                 （选择器不弹，iOS 正常），故安卓走原生桥唤起原生选择器 -->
            <ais-button
              v-else-if="hasNativePicker"
              plain
              size="small"
              :loading="uploading"
              @click="openNativePicker"
            >
              上传附件
            </ais-button>
            <!-- 安卓兜底：无原生选择器能力时，用自绘隐藏 input 触发系统文件选择器 -->
            <ais-button
              v-else
              plain
              size="small"
              :loading="uploading"
              @click="openFallbackPicker"
            >
              上传附件
            </ais-button>
          </div>
          <!-- 安卓原生选择器回调由原生直接落库并回传 URL，无需 H5 再传流 -->
          <input
            ref="fileInputRef"
            type="file"
            class="hidden-file-input"
            :accept="acceptAttr"
            multiple
            @change="onNativeFileChange"
          />
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast, showSuccessToast, showImagePreview } from 'vant'
import AisButton from '@/components/AisButton.vue'
import { getRiskCheckVehicleDetail, submitRiskCheckResult } from '@/api/riskCheck'
import { getFileList, uploadFile, bindFile, deleteAttachmentConfig, getUploadConfig, uploadFileByUrl } from '@/libs/api/fileConfig'
import { getNavigatorType } from '@/libs/utils/index'
import { NAVIGATOR_TYPE_ANDROID } from '@/libs/utils/constants'
import { getAppImgLimit } from '@/libs/utils/nativeFn'

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

// 🔑 风险排查附件的统一业务标识，后端附件配置（attachmentConfig）已建好：
//   - 作为 configCode 拉配置（getUploadConfig），配置内含数量/格式/大小限制
//   - 作为 attachType 落库绑定（bindFile / uploadFileByUrl）
// 单一常量：两处口径必须一致，改动只改这里
const RISK_CHECK_ATTACH_CODE = 'vehicle_risk_task'
// 安卓原生容器判定：原生 App 内嵌 WebView 才有 window.Android；
// vant uploader 的 opacity:0 隐藏 input 在安卓 WebView 上点击不派发 → 选择器不弹（iOS 正常）
const isAndroid = getNavigatorType() === NAVIGATOR_TYPE_ANDROID
const hasNativePicker = !!(window.Android && window.Android.selectImageLimit)
const fileList = ref([])
const uploading = ref(false)
const submitLoading = ref(false)
const checkResultNote = ref('')
const showVideo = ref(false)
const videoUrl = ref('')
const fileInputRef = ref(null)
// 附件上传配置：maxNum 数量上限、maxSize 单文件大小上限(MB)、acceptSuffix 允许后缀
const uploadConfig = ref({})
// 允许的附件后缀（来自后端 attachmentConfig）；拉取失败时回落 PRD 7.1.2.4 的 14 种格式
const DEFAULT_ACCEPT_SUFFIX = '.png,.jpg,.jpeg,.gif,.pdf,.ppt,.pptx,.xlsx,.xls,.docx,.doc,.rar,.zip,.mp4'
// 后缀 → MIME 映射：安卓 WebView 的文件选择器按 MIME 过滤，
// 只给后缀（.pdf,.docx）时安卓常只列图片类目，故 accept 同时给出 MIME
const EXT_MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.rar': 'application/vnd.rar',
  '.zip': 'application/zip',
  '.mp4': 'video/mp4'
}
// 后缀白名单（用于前端校验）
const acceptSuffix = computed(() => uploadConfig.value.acceptSuffix || DEFAULT_ACCEPT_SUFFIX)
// HTML accept 属性值：后缀 + MIME 组合，双端都能唤起正确的文件类型
const acceptAttr = computed(() => {
  const exts = acceptSuffix.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  const mimes = exts.map((ext) => EXT_MIME_MAP[ext]).filter(Boolean)
  return [...new Set([...exts, ...mimes])].join(',')
})
const maxFileNum = computed(() => Number(uploadConfig.value.maxNum) || 0) // 0 = 不限制
const maxFileSize = computed(() => Number(uploadConfig.value.maxSize) || 0) // 0 = 不限制，单位 MB

// 排查状态：10待排查 60审核中 110已排查 160已驳回 210取消排查
const statusTextMap = { 10: '待排查', 60: '审核中', 110: '已排查', 160: '已驳回', 210: '取消排查' }
const statusClassMap = { 10: 'pending', 60: 'auditing', 110: 'done', 160: 'reject', 210: 'cancel' }

const canSubmit = computed(() => detail.value.checkStatus === 10 || detail.value.checkStatus === 160)
const statusClass = computed(() => statusClassMap[detail.value.checkStatus] || 'pending')

// ==================== 排查方法附件 ====================
// PC 端下发排查任务时附件按 businessId = 父任务ID（check_task_id）绑定，
// 明细详情接口 detailVin 返回的 checkTaskId 即父任务ID（MapStruct 同名自动映射），直接按它查
const methodFiles = ref([])
const loadMethodFiles = () => {
  const checkTaskId = detail.value.checkTaskId
  if (!checkTaskId) {
    methodFiles.value = []
    return
  }
  return getFileList({ businessId: checkTaskId })
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

// 原生桥回调处理函数（具名常量：卸载时需比对还原 window.getImage）
const nativeImageHandler = async(url) => {
  if (!url) return
  await bindNativeFile(url)
}

onMounted(() => {
  getDetail()
  fetchUploadConfig()
  // 原生桥回调：安卓原生选择器选完文件后，由原生回传已上传的 URL
  // （协议与 DetailCard/Inner.vue 一致：window.getImage(url)）
  window.getImage = nativeImageHandler
})

// window.getImage 是全局单槽（DetailCard/Inner.vue 等也在用），
// 本页卸载时还原，避免 keepAlive 场景下残留回调把文件错绑到已卸载页面
onBeforeUnmount(() => {
  if (window.getImage === nativeImageHandler) {
    delete window.getImage
  }
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
        // 排查方法附件：businessId = checkTaskId（父任务ID），与 TaskDetailView 弹窗同款展示
        loadMethodFiles()
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

// ==================== 附件配置（数量/格式/大小限制来自后端 attachmentConfig） ====================
// getUploadConfig({configCode, businessData}) → res.data.detailList[]，
// 按 attachType 匹配出本单据的明细项（协议同 vehretail-h5 vehicleLicenseInfo.vue）
const fetchUploadConfig = () => {
  return getUploadConfig({
    configCode: RISK_CHECK_ATTACH_CODE,
    businessData: JSON.stringify({ businessId: detailId.value })
  })
    .then((res) => {
      if (res.code !== 200 || !res.data) return
      const detailList = res.data.detailList || []
      // 按 attachType 精确匹配；匹配不到则取第一项作为兜底
      const matched = detailList.find((item) => item.attachType === RISK_CHECK_ATTACH_CODE) || detailList[0] || {}
      uploadConfig.value = {
        acceptSuffix: matched.acceptSuffix || '',
        maxNum: matched.maxNum || 0,
        maxSize: matched.maxSize || 0,
        required: matched.required || '0'
      }
    })
    .catch(() => {
      // 配置拉取失败不阻断上传，回落到 PRD 14 种格式 + 不限数量
      uploadConfig.value = {}
    })
}

// 上传前校验：数量上限、单文件大小上限、后缀白名单
const validateFiles = (files) => {
  const list = Array.isArray(files) ? files : [files]
  // 数量上限（maxNum 为 0 表示不限制）
  if (maxFileNum.value > 0 && fileList.value.length + list.length > maxFileNum.value) {
    showFailToast(`最多上传${maxFileNum.value}个附件`)
    return false
  }
  // 后缀白名单
  const allowExts = acceptSuffix.value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (allowExts.length) {
    const bad = list.find((f) => {
      const name = (f.name || '').toLowerCase()
      return !allowExts.some((ext) => name.endsWith(ext))
    })
    if (bad) {
      showFailToast(`仅支持${allowExts.join('、')}格式的附件`)
      return false
    }
  }
  // 单文件大小上限（maxSize 单位 MB，为 0 表示不限制）
  if (maxFileSize.value > 0) {
    const limit = maxFileSize.value * 1024 * 1024
    const big = list.find((f) => f.size && f.size > limit)
    if (big) {
      showFailToast(`单个附件不能超过${maxFileSize.value}MB`)
      return false
    }
  }
  return true
}

// vant uploader 的上传前钩子：命中数量/格式/大小限制时拦截并提示
const beforeRead = (file) => {
  const files = Array.isArray(file) ? file : [file]
  return validateFiles(files)
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
        attachType: RISK_CHECK_ATTACH_CODE,
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

// ==================== 安卓原生桥上传分支 ====================
// 安卓原生容器里 vant uploader 的隐藏 input 点击不派发（选择器不弹），
// 故安卓改走原生桥：getAppImgLimit → 原生选择文件并上传 → 回调 window.getImage(url)
const openNativePicker = () => {
  if (uploading.value) return
  // 数量上限由 H5 拦（原生侧只管单文件大小），maxNum 为 0 表示不限制
  if (maxFileNum.value > 0 && fileList.value.length >= maxFileNum.value) {
    showFailToast(`最多上传${maxFileNum.value}个附件`)
    return
  }
  // 原生侧按 limitSize(MB) 限制单文件大小
  getAppImgLimit(maxFileSize.value || 10, maxFileNum.value || 0)
}

// 原生回传已上传的 URL → 落库并绑定到当前排查明细
const bindNativeFile = async(url) => {
  // 原生侧只按大小限制，格式/数量仍需 H5 兜底校验
  const fileName = decodeURIComponent(String(url).split('/').pop()?.split('?')[0] || '')
  const allowExts = acceptSuffix.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  if (allowExts.length && !allowExts.some((ext) => fileName.toLowerCase().endsWith(ext))) {
    showFailToast(`仅支持${allowExts.join('、')}格式的附件`)
    return
  }
  if (maxFileNum.value > 0 && fileList.value.length >= maxFileNum.value) {
    showFailToast(`最多上传${maxFileNum.value}个附件`)
    return
  }
  uploading.value = true
  try {
    // uploadFileByUrl 入参为数组：{fileUrl, businessId, configCode, attachType}
    const res = await uploadFileByUrl([{
      fileUrl: url,
      businessId: detailId.value,
      configCode: RISK_CHECK_ATTACH_CODE,
      attachType: RISK_CHECK_ATTACH_CODE
    }])
    if (res.code === 200) {
      await loadAttachments()
      showSuccessToast('上传成功')
    } else {
      showFailToast(res.msg || '附件上传失败，请重试')
    }
  } catch {
    showFailToast('附件上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

// 安卓兜底：无原生选择器能力时，用自绘隐藏 input 触发系统文件选择器
// （隐藏方式用 1px + clip 而非 display:none / opacity:0，后两者在安卓 WebView 上点击不派发）
const openFallbackPicker = () => {
  if (uploading.value) return
  if (maxFileNum.value > 0 && fileList.value.length >= maxFileNum.value) {
    showFailToast(`最多上传${maxFileNum.value}个附件`)
    return
  }
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

// 隐藏 file input 的 change 回调：安卓 WebView 内置选择器（若可用）走标准流上传
const onNativeFileChange = async(event) => {
  const files = Array.isArray(event.target.files) ? Array.from(event.target.files) : []
  // 清空 value，允许重复选择同一文件
  event.target.value = ''
  if (!files.length) return
  if (!validateFiles(files)) return
  uploading.value = true
  try {
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await uploadFile(formData)
      const data = (uploadRes && uploadRes.data) || {}
      await bindFile({
        fileId: data.id,
        fileName: data.originalFilename || data.filename,
        fileUrl: data.url,
        fileSize: data.size,
        fileType: data.ext,
        attachType: RISK_CHECK_ATTACH_CODE,
        businessId: detailId.value
      })
    }
    await loadAttachments()
    showSuccessToast('上传成功')
  } catch {
    showFailToast('附件上传失败，请重试')
  } finally {
    uploading.value = false
  }
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

  .attach-title {
    font-size: 13px;
    color: #888;
    margin-top: 12px;
    margin-bottom: 4px;
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

  // 隐藏的文件选择 input：不能用 display:none（部分安卓 WebView 下点击不唤起选择器），
  // 也不能用 opacity:0（vant uploader 在安卓上的原症），改为零尺寸移出可视区
  .hidden-file-input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
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
