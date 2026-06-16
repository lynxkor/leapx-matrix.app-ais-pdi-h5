<template>
  <div class="search-page-wrapper">
    <!-- 自定义搜索框头部 -->
    <div class="search-header">
      <van-icon name="arrow-left" size="16" color="#191A1B" @click="goBack" />
      <van-search
        v-model="localSearchValue"
        shape="round"
        :autofocus="true"
        placeholder="搜索"
        @search="onLocalSearch"
        class="page-search-input"
      >
        <template #left-icon>
          <van-icon name="search" size="16" color="#191A1B" />
        </template>
        <template #right-icon>
          <div class="search-inner-btn" @click="onLocalSearch(localSearchValue)">搜索</div>
        </template>
      </van-search>
    </div>

    <div class="search-full-page">
      <!-- 搜索加载状态 -->
      <div class="search-loading-wrapper" v-if="searchLoading">
        <van-loading type="circular" color="#009100" />
        <span class="loading-text">搜索中...</span>
      </div>

      <!-- 搜索结果列表 -->
      <div class="common-scroll-content" v-else-if="searchResults.length > 0">
        <list-item v-for="(item, index) in searchResults" :key="index" :dataItem="item">
          <ais-button
            type="primary"
            plain
            round
            @click.stop="PDIBtnClick(item)"
            v-show="showPdiButton(item)"
          >
            {{ getButtonText(item) }}
          </ais-button>
        </list-item>
      </div>

      <!-- 无搜索结果 -->
      <div class="no-results-wrapper" v-else-if="hasSearched">
        <div class="no-results-content">
          <img src="../../libs/assets/image/no-data.png" alt="无搜索结果" class="no-results-img" />
          <p class="no-results-text">没有找到相关内容</p>
        </div>
      </div>
    </div>

    <!-- PDI 录入确认对话框 -->
    <ais-dialog :key="dialogKey" :showDialog="showDialog" :dialogObj="dialogObj">
      <p class="dialog-line-text">近期PDI重点关注，漏检产生投诉与损失由门店自担。</p>
      <p class="dialog-line-text">1、车辆网络是否正常必检，播放视频检查网络状态；</p>
      <p class="dialog-line-text">2、座椅皮面是否破损必检，掀开保护套检查后复原；</p>
      <p class="dialog-line-text">3、玻璃表面是否完好必检，检查全车玻璃及屏幕表面；</p>
    </ais-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores/global'
import { getPdiList } from '@/api/pdi'
import { getOwnerTree } from '@/libs/api/common'
import { showToast } from 'vant'
import ListItem from '@/components/ListItem.vue'
import AisButton from '@/components/AisButton.vue'
import AisDialog from '@/libs/components/AisDialog.vue'

const route = useRoute()
const router = useRouter()
const globalStore = useGlobalStore()

// 返回上一页
const goBack = () => {
  router.back()
}

// 本地状态管理
const localSearchValue = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const hasSearched = ref(false)
const resourceBtnList = ref([])

// 对话框相关
const showDialog = ref(false)
const dialogKey = ref(0)
const dialogObj = {
  id: '',
  vin: '',
  code: '',
  title: '注意事项',
  submitText: '确定',
  cancelText: '取消',
  // 确认按钮 3 秒倒计时后才可点击;传 0 或不传则不启用
  countdown: 3,
  submitFn: () => dialogSubmitFn(),
  cancelFn: () => dialogCancelFn()
}

// 页面加载时
onMounted(async() => {
  globalStore.setTitle('')
  getOwnerTreeList()

  // 从路由参数获取初始搜索值
  if (route.params.initialValue) {
    localSearchValue.value = route.params.initialValue
    await nextTick()
    if (localSearchValue.value.trim()) {
      await handleSearch(localSearchValue.value)
    }
  }
})

// 监听全局搜索事件
let unwatchSearch = null
onMounted(() => {
  unwatchSearch = watch(
    () => globalStore.searchTrigger,
    () => {
      if (globalStore.searchValue) {
        localSearchValue.value = globalStore.searchValue
        handleSearch(globalStore.searchValue)
      }
    }
  )
})

onUnmounted(() => {
  if (unwatchSearch) {
    unwatchSearch()
  }
})

// 获取权限列表
const getOwnerTreeList = () => {
  getOwnerTree({ resourceTag: 'AISVS100001', resourceType: 'APP_SIDE' })
    .then((res) => {
      res.data.forEach((item) => {
        resourceBtnList.value.push(item.resourceTag)
      })
    })
    .catch(() => {})
}

// 本地搜索框触发搜索
const onLocalSearch = (val) => {
  if (!val || !val.trim()) {
    showToast('请输入搜索关键词')
    return
  }
  handleSearch(val.trim())
}

// 搜索处理
const handleSearch = async(keyword) => {
  if (!keyword) return

  searchLoading.value = true
  searchResults.value = []
  hasSearched.value = true

  try {
    const searchParams = {
      vinLastSix: keyword,
      pageNum: 1,
      pageSize: 100
    }

    const res = await getPdiList(searchParams)
    if (res.code === 200) {
      searchResults.value = res.data.records || []
    } else {
      searchResults.value = []
    }
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
    showToast('搜索失败，请稍后重试')
  } finally {
    searchLoading.value = false
  }
}

// PDI按钮点击 - 与 ListView.vue 一致
const PDIBtnClick = (item) => {
  dialogObj.id = item.id
  dialogObj.vin = item.vin
  dialogObj.code = item.code
  showDialog.value = true
}

// 对话框确认 - 与 ListView.vue 一致
const dialogSubmitFn = async() => {
  showDialog.value = false
  // 根据 vehPdiType 判断跳转类型
  const currentItem = searchResults.value.find((item) => item.id === dialogObj.id)
  const type = currentItem?.vehPdiType === 20 ? 'repair' : 'detail'
  router.push({
    path: '/pdi/detail',
    query: {
      id: dialogObj.id,
      vin: dialogObj.vin,
      code: dialogObj.code,
      type
    }
  })
}

// 对话框取消
const dialogCancelFn = () => {
  showDialog.value = false
}

// 判断按钮显示逻辑
// 1. isPdiSubmit=1 && isUnusual=1 && isRepaired=0 时显示"异常修复确认"按钮
// 2. isPdiSubmit=0 时显示"PDI录入"按钮
// 3. 其他情况不显示按钮
const showPdiButton = (item) => {
  // 异常修复确认 - 需要满足条件且有对应权限
  if (item.isPdiSubmit === 1 && item.isUnusual === 1 && item.isRepaired === 0) {
    return (
      resourceBtnList.value.includes('AISVS-storeVehiclePdi-addRepairConfirm') &&
      resourceBtnList.value.includes('AISVS-storeVehiclePdi-getRepairConfirmDetails')
    )
  } else if (item.isPdiSubmit === 0) {
    // PDI录入 - 需要有对应权限
    return (
      resourceBtnList.value.includes('AISVS-storeVehiclePdi-addPdiEntry') &&
      resourceBtnList.value.includes('AISVS-storeVehiclePdi-getPdiEntryDetails')
    )
  }
  // 其他情况不显示按钮
  return false
}

// 获取按钮文本
const getButtonText = (item) => {
  // 异常修复确认
  if (item.isPdiSubmit === 1 && item.isUnusual === 1 && item.isRepaired === 0) {
    return '异常修复确认'
  }
  // PDI录入
  return 'PDI录入'
}
</script>

<style lang="scss" scoped>
// 自定义搜索头部样式
.search-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 7px 12px;
  box-sizing: border-box;
  z-index: 6000;

  :deep(.van-search) {
    padding: 0;
  }

  .page-search-input {
    width: 100%;
    max-width: 375px;
    height: 30px;
    margin-left: 10px;

    :deep(.van-field__right-icon) {
      padding: 0;
    }

    :deep(.van-search__content) {
      background-color: rgba(216, 216, 216, 0.3);
      border-radius: 15px;
      padding-right: 4px;
    }

    :deep(.van-search__field) {
      background-color: transparent;
      min-height: 30px;
    }

    :deep(.van-field__control) {
      font-size: 12px;
      height: 30px;
      line-height: 30px;
    }

    :deep(.van-field__left-icon) {
      align-self: center;
    }

    .search-inner-btn {
      background-color: #009100;
      color: #fff;
      height: 26px;
      width: 52px;
      font-size: 12px;
      font-weight: 400;
      border-radius: 15px;
      padding: 4px 14px;
      white-space: nowrap;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.search-full-page {
  width: 100%;
  min-height: 100%;
  background-color: #f7f7f7;
  display: flex;
  flex-direction: column;
  padding-top: 44px;
}

// 搜索加载状态
.search-loading-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;

  .loading-text {
    font-size: 14px;
    color: #999;
  }
}

// 搜索结果列表 - 与 ListView.vue 一致
.common-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
}

// 无搜索结果
.no-results-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;

  .no-results-content {
    text-align: center;

    .no-results-img {
      width: 230px;
      height: 142px;
      margin-bottom: 16px;
      margin-top: 228px;
    }

    .no-results-text {
      font-size: 16px;
      color: #666;
      margin-bottom: 8px;
    }

    .no-results-desc {
      font-size: 14px;
      color: #6c6e6c;
    }
  }
}

// 对话框文本样式 - 与 ListView.vue 一致
.dialog-line-text {
  font-family: "PingFang SC", sans-serif;
  font-size: 14px;
  letter-spacing: 0.43px;
  color: #545454;
}
</style>
