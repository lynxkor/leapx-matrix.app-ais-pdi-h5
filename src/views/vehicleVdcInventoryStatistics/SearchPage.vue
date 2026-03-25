<template>
  <div class="search-page-wrapper">
    <!-- 自定义搜索框头部 -->
    <div class="search-header">
      <van-icon name="arrow-left" size="16" color="#191A1B" @click="goBack" />
      <van-search
        v-model="localSearchValue"
        shape="round"
        :autofocus="true"
        placeholder="搜索物料描述、物料编码"
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
        <div class="inventory-list">
          <div class="inventory-header">
            <span class="header-materials">物料描述</span>
            <div class="header-resource">
              <span class="header-item">库存</span>
              <span class="header-item">生产</span>
              <span class="header-item">排产</span>
            </div>
          </div>
          <div class="inventory-item" v-for="(item, index) in searchResults" :key="index">
            <div class="materials-desc">{{ item.materialsDesc }}</div>
            <div class="resource-row">
              <div class="resource-item">
                <div class="resource-content">
                  <span class="dot-badge" :style="{ backgroundColor: getResourceColor(item.inventoryResource) }"></span>
                  <span class="resource-desc" :class="getResourceClass(item.inventoryResource)">{{ getResourceDesc(item.inventoryResource) }}</span>
                </div>
              </div>
              <div class="resource-item">
                <div class="resource-content">
                  <span class="dot-badge" :style="{ backgroundColor: getResourceColor(item.productionInProgressResource) }"></span>
                  <span class="resource-desc" :class="getResourceClass(item.productionInProgressResource)">{{ getResourceDesc(item.productionInProgressResource) }}</span>
                </div>
              </div>
              <div class="resource-item">
                <div class="resource-content">
                  <span class="dot-badge" :style="{ backgroundColor: getResourceColor(item.productionScheduledResource) }"></span>
                  <span class="resource-desc" :class="getResourceClass(item.productionScheduledResource)">{{ getResourceDesc(item.productionScheduledResource) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无搜索结果 -->
      <div class="no-results-wrapper" v-else-if="hasSearched">
        <div class="no-results-content">
          <img src="../../libs/assets/image/no-data.png" alt="无搜索结果" class="no-results-img" />
          <p class="no-results-text">没有找到相关内容</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores/global'
import { getList } from '@/api/vehicleVdcInventoryStatistics'
import { showToast } from 'vant'

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

// 页面加载时
onMounted(async() => {
  globalStore.setTitle('')

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
      pageNum: 1,
      pageSize: 100
    }

    // 判断是物料描述还是物料编码
    if (/^[A-Z0-9]+$/i.test(keyword)) {
      searchParams.materialsCodeLike = keyword
    } else {
      searchParams.materialsDescLike = keyword
    }

    const res = await getList(searchParams)
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

// 获取资源颜色
const getResourceColor = (type) => {
  switch (type) {
    case 10: // 无
      return '#ccc'
    case 20: // 极少
      return '#E30808'
    case 30: // 少量
      return '#FFA400'
    case 40: // 充足
      return '#00AA00'
    default:
      return '#ccc'
  }
}

// 获取资源描述
const getResourceDesc = (type) => {
  switch (type) {
    case 10:
      return '无'
    case 20:
      return '极少'
    case 30:
      return '少量'
    case 40:
      return '充足'
    default:
      return '-'
  }
}

// 获取资源样式类
const getResourceClass = (type) => {
  switch (type) {
    case 40:
      return 'sufficient' // 充足
    case 30:
      return 'low' // 少量
    case 20:
      return 'scarce' // 极少
    case 10:
      return 'none' // 无
    default:
      return ''
  }
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
      color: #ffffff;
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

// 搜索结果列表
.common-scroll-content {
  flex: 1;
  overflow-y: auto;
}

.inventory-list {
  padding: 0;
  background: #fff;
}

.inventory-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f7f8fa;
  border-bottom: 1px solid #ebedf0;
  position: sticky;
  top: 44px;
  z-index: 100;

  .header-materials {
    flex: 1;
    font-size: 14px;
    color: #969799;
    font-weight: 400;
  }

  .header-resource {
    display: flex;
    width: 180px;
    justify-content: space-around;

    .header-item {
      font-size: 14px;
      color: #969799;
      font-weight: 400;
    }
  }
}

.inventory-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;

  &:last-child {
    border-bottom: none;
  }

  .materials-desc {
    flex: 1;
    font-size: 14px;
    color: #323233;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
    padding-right: 16px;
  }

  .resource-row {
    display: flex;
    width: 180px;
    justify-content: space-around;

    .resource-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .resource-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }

      .dot-badge {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }

      .resource-desc {
        font-size: 12px;
        color: #323233;

        &.sufficient {
          color: #07c160;
        }

        &.low {
          color: #ff976a;
        }

        &.scarce {
          color: #ee0a24;
        }

        &.none {
          color: #969799;
        }
      }
    }
  }
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
  }
}
</style>
