<template>
  <div class="search-page-wrapper">
    <!-- 自定义搜索框头部 -->
    <div class="search-header">
      <van-icon name="arrow-left" size="16" color="#191A1B" @click="goBack" />
      <van-search
        v-model="localSearchValue"
        shape="round"
        :autofocus="true"
        placeholder="搜索车辆 VIN 后六位"
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
        <div v-for="(item, index) in searchResults" :key="index" class="list-item-content">
          <!-- VIN 和电量标签同行 -->
          <div class="title-row">
            <div class="card-title-text">{{ item.vin }}</div>
            <div class="battery-tag-row">
              <span class="battery-tag">
                <span class="battery-icon" :style="{ '--battery-level': getBatteryLevel(item.electricity) }">
                  <svg class="battery-outline" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="6" width="14" height="12" rx="2"/>
                    <line x1="21" y1="10" x2="21" y2="14"/>
                  </svg>
                </span>
                <span class="percent">{{ formatElectricity(item.electricity) }}%</span>
                <span class="divider">|</span>
                <span class="days">{{ item.continuousLowBatteryDays }}天</span>
              </span>
            </div>
          </div>
          <!-- 车型描述 -->
          <div class="card-subtitle-text">{{ item.materialsDesc }}</div>

          <!-- 信息网格 -->
          <van-row class="card-info">
            <van-col span="12" class="card-info-col">
              <p class="card-info-title">低电量获取时间：</p>
              <p class="card-info-des">{{ item.abnormalRecordTime }}</p>
            </van-col>
            <van-col span="12" class="card-info-col">
              <p class="card-info-title">是否锁定：</p>
              <p class="card-info-des">{{ item.lockStatus === 0 ? '否' : '是' }}</p>
            </van-col>
            <van-col span="12" class="card-info-col">
              <p class="card-info-title">销售门店：</p>
              <p class="card-info-des">{{ item.saleDealerName || '-' }}</p>
            </van-col>
            <van-col span="12" class="card-info-col">
              <p class="card-info-title">交付门店：</p>
              <p class="card-info-des">{{ item.deliveryDealerName || '-' }}</p>
            </van-col>
            <van-col span="24" class="card-info-col">
              <p class="card-info-title">仓库地址：</p>
              <p class="card-info-des">{{ item.dealerWarehouseAddress || '-' }}</p>
            </van-col>
          </van-row>
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
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores/global'
import { getList } from '@/api/abnormalRecord'
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
      vinLastSix: keyword,
      fenceCrossedType: 50,
      pageNum: 1,
      pageSize: 100
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

// 格式化电量显示
const formatElectricity = (electricity) => {
  if (electricity === null || electricity === undefined) return 0
  return electricity >= 1 ? Math.round(electricity) : Math.round(electricity * 100)
}

// 获取电池电量百分比（用于样式）
const getBatteryLevel = (electricity) => {
  if (electricity === null || electricity === undefined) return 0
  const percent = electricity >= 1 ? electricity : electricity * 100
  return percent
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

// 搜索结果列表
.common-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.list-item-content {
  background: #fff;
  padding: 12px;
  border-radius: 7px;
  margin-bottom: 12px;

  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .card-title-text {
      font-family: "PingFang SC", sans-serif;
      font-size: 15px;
      font-weight: 500;
      color: var(--leap-color-default);
    }

    .battery-tag-row {
      .battery-tag {
        display: inline-flex;
        align-items: center;
        padding: 3px 6px;
        border-radius: 3px;
        font-size: 11px;
        background: #F8E8E8;
        color: var(--leap-color-danger);

        .battery-icon {
          position: relative;
          display: inline-block;
          width: 18px;
          height: 18px;
          margin-right: 4px;

          .battery-outline {
            width: 100%;
            height: 100%;
            color: var(--leap-color-danger);
          }

          // 使用伪元素填充电池内部
          &::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 5px;
            width: calc(var(--battery-level) * 0.1px);
            height: 6px;
            background: var(--leap-color-danger);
            border-radius: 1px;
            transform: translateY(-50%);
          }
        }

        .divider {
          margin: 0 4px;
          opacity: 0.4;
        }

        .days {
          color: var(--leap-color-danger);
        }
      }
    }
  }

  .card-subtitle-text {
    font-family: "PingFang SC", sans-serif;
    font-size: 13px;
    color: var(--leap-color-default-light-1);
    margin-top: 4px;
  }

  .card-info {
    box-sizing: border-box;
    background: var(--leap-color-default-light-6);
    margin-top: 12px;
    padding-bottom: 8px;
    border-radius: 4px;

    .card-info-col {
      font-family: "PingFang SC", sans-serif;
      font-size: 12px;
      padding: 8px;
      padding-bottom: 0;

      .card-info-title {
        color: var(--leap-color-default-light-2);
        margin-bottom: 2px;
      }

      .card-info-des {
        color: var(--leap-color-default-light-1);
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

    .no-results-desc {
      font-size: 14px;
      color: #6c6e6c;
    }
  }
}
</style>
