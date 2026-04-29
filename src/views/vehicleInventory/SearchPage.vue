<template>
  <div class="search-page-wrapper">
    <!-- 自定义搜索框头部 -->
    <div class="search-header">
      <van-icon name="arrow-left" size="16" color="#191A1B" @click="goBack" />
      <van-search
        v-model="localSearchValue"
        shape="round"
        :autofocus="true"
        placeholder="搜索车型名称"
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
        <div v-for="(item, index) in searchResults" :key="index" class="series-card">
          <!-- 车系标题 -->
          <div class="series-header">
            <span class="series-name">{{ item.seriesName }}</span>
            <span class="series-total">[ {{ item.available }} 辆 ]</span>
            <van-icon name="information-o" class="info-icon" />
          </div>

          <!-- 表头 -->
          <div class="table-header">
            <div class="th model-name">车型</div>
            <div class="th">在途</div>
            <div class="th">在库</div>
            <div class="th">预留</div>
            <div class="th">锁定</div>
            <div class="th available">
              可用
              <van-icon name="question-o" class="question-icon" @click="showQuestion = true" />
            </div>
          </div>

          <!-- 数据行 -->
          <div
            v-for="(detail, detailIndex) in item.detailList"
            :key="detailIndex"
            class="table-row"
            @click="onRowClick(detail)"
          >
            <div class="td model-name">{{ detail.modelName }}</div>
            <div class="td">{{ detail.onWay || 0 }}</div>
            <div class="td">{{ detail.inStock || 0 }}</div>
            <div class="td">{{ detail.reserved || 0 }}</div>
            <div class="td">{{ detail.locked || 0 }}</div>
            <div class="td available">{{ detail.available || 0 }}</div>
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

    <van-dialog
      v-model:show="showQuestion"
      title="车辆可用总数取数逻辑"
      message="在途 + 在库 - 预留 - 锁车 = 车辆可用总数"
      show-confirm-button
      :confirm-button-color="'#07c160'"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores/global'
import { getList } from '@/api/vehicleInventory'
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
const showQuestion = ref(false)

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
      pageNum: 1,
      pageSize: 100
    }

    const res = await getList(searchParams)
    if (res.code === 200) {
      const list = res.data || []
      // 根据关键词过滤搜索结果
      searchResults.value = list.filter((item) =>
        item.seriesName.toLowerCase().includes(keyword.toLowerCase()) ||
        item.detailList?.some((detail) =>
          detail.modelName.toLowerCase().includes(keyword.toLowerCase())
        )
      )
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

// 行点击事件
const onRowClick = (detail) => {
  console.log('点击行:', detail)
  // router.push({ path: '/detail', query: { vin: detail.vin } })
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
  padding: 12px;
}

.series-card {
  background: #ffffff;
  border-radius: 7px;
  padding: 12px;
  margin-bottom: 12px;

  .series-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .series-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--leap-color-primary);
    }

    .series-total {
      font-size: 14px;
      font-weight: 600;
      color: var(--leap-color-primary);
      margin-left: 4px;
    }

    .info-icon {
      font-size: 14px;
      color: var(--leap-color-primary);
      margin-left: 4px;
    }
  }

  .table-header {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 1fr;
    padding: 8px 0;
    border-bottom: 1px solid var(--leap-color-default-light-4);

    .th {
      font-size: 12px;
      color: var(--leap-color-primary);
      text-align: center;

      &.model-name {
        text-align: left;
      }

      &.available {
        color: var(--leap-color-primary);
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;

        .question-icon {
          font-size: 12px;
          cursor: pointer;
          opacity: 0.7;

          &:hover {
            opacity: 1;
          }
        }
      }
    }
  }

  .table-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 1fr;
    padding: 10px 0;
    border-bottom: 1px solid var(--leap-color-default-light-4);

    &:last-child {
      border-bottom: none;
    }

    .td {
      font-size: 12px;
      color: var(--leap-color-default-light-1);
      text-align: center;

      &.model-name {
        text-align: left;
        color: var(--leap-color-default);
        font-weight: 500;
      }

      &.available {
        color: var(--leap-color-primary);
        font-weight: 500;
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
