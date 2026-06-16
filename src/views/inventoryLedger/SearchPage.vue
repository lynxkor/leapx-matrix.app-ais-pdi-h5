<template>
  <div class="search-page-wrapper">
    <!-- 自定义搜索框头部 -->
    <div class="search-header">
      <van-icon name="arrow-left" size="16" color="#191A1B" @click="goBack" />
      <van-search
        v-model="localSearchValue"
        shape="round"
        :autofocus="true"
        placeholder="搜索 VIN/车架号"
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

    <div class="tab-content tab-content-ledger">
      <van-tabs v-model:active="active" sticky scrollable>
        <van-tab v-for="(item, index) in tabList" :title="item" :key="index"></van-tab>
      </van-tabs>
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
            @click.stop="generatePdiClick(item)"
            v-show="resourceBtnList.includes('AISVS-storeInventoryLedger-generatePdi') && item.vechicleStatus === 12"
          >
            生成在库 PDI 单
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores/global'
import { getList } from '@/api/inventoryLedger'
import { showToast } from 'vant'
import ListItem from '@/components/ListItem.vue'
import AisButton from '@/components/AisButton.vue'
import { getOwnerTree } from '@/libs/api/common'

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
const tabList = ['全部车辆', '未匹配订单车辆', '在途车辆', '异常车辆', '长库龄车辆']
const statusList = [10, 20, 30, 40, 50]
const active = ref(0)
const searchParams = ref({
  storeInventoryLedgerTab: 10,
  vinLike: '',
  pageNum: 1,
  pageSize: 100
})

// 页面加载时
onMounted(async() => {
  globalStore.setTitle('')
  getOwnerTreeList()

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

// 获取权限列表
const getOwnerTreeList = () => {
  getOwnerTree({ resourceTag: 'AISVS-storeInventoryLedger', resourceType: 'APP_SIDE' })
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
    searchParams.value.vinLike = keyword
    searchParams.value.pageNum = 1

    const res = await getList(searchParams.value)
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

// 生成 PDI 点击
const generatePdiClick = (item) => {
  router.push({
    path: '/inventoryLedger/detail',
    query: {
      id: item.id,
      vin: item.vin
    }
  })
}

// 监听 tab 切换
watch(
  () => active.value,
  (newVal) => {
    searchParams.value.storeInventoryLedgerTab = statusList[newVal]
    if (localSearchValue.value) {
      handleSearch(localSearchValue.value)
    }
  }
)
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
  padding-top: 86px; // 44px header + 42px tabs
}

.tab-content {
  width: 100%;
  overflow-x: auto;
  height: 42px;
  overflow-y: hidden;
  position: fixed;
  top: 44px;
  left: 0;
  z-index: 5999;
  background: #fff;

  :deep(.van-tabs__wrap) {
    height: 42px !important;
  }

  :deep(.van-tab) {
    flex: none !important;
    width: auto !important;
    padding: 0 18px !important;
  }

  :deep(.van-tabs__nav) {
    overflow-x: auto !important;
    flex-wrap: nowrap !important;
  }
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
</style>
