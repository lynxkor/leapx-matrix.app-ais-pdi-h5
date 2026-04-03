<template>
  <filter-header
    ref="filterHeaderRef"
    :placeholder="headerPlaceholder"
    :search-page-route="'InventoryLedgerSearch'"
    @search="headerSearch"
    :filterList="searchList"
    @filterSearch="filterSearch"
    :showSort="false"
    :showScan="true"
    @searchChange="handleSearchChange"
  />
  <div class="tab-content tab-content-ledger">
    <van-tabs v-model:active="active" sticky scrollable>
      <van-tab v-for="(item, index) in tabList" :title="item" :key="index"></van-tab>
    </van-tabs>
  </div>
  <div class="common-scroll-content" ref="scrollEle">
    <refresh-list
      :requestData="requestData"
      :needRefresh="needRefresh"
      :has-no-data="
        dataList.length === 0 &&
        requestData.data &&
        (requestData.data.storeInventoryLedgerTab ||
          requestData.data.seriesIdList?.length ||
          requestData.data.modelIdList?.length ||
          requestData.data.vinLike)
      "
      @setData="setData"
      @resetFilters="resetFilterConditions"
    >
      <div v-for="(item, index) in dataList" :key="index" class="list-item-content">
        <div class="card-header">
          <div class="card-title-text">{{ item.vin }}</div>
          <div class="card-tags">
            <van-tag v-if="item.vechicleStatusLabel" type="primary">{{ item.vechicleStatusLabel }}</van-tag>
            <van-tag v-if="item.reservationStatusLabel" type="success">{{ item.reservationStatusLabel }}</van-tag>
          </div>
        </div>
        <div class="card-subtitle-text">
          {{ item.materialsDesc || item.modelName }} | {{ item.exteriorName }} | {{ item.interiorName }}
        </div>
        <van-row class="card-info">
          <van-col span="12" class="card-info-col">
            <p class="card-info-title">基本车型：</p>
            <p class="card-info-des">{{ item.modelName || '-' }}</p>
          </van-col>
          <van-col span="12" class="card-info-col">
            <p class="card-info-title">是否预留：</p>
            <p class="card-info-des">{{ item.reserved === 1 ? '是' : '否' }}</p>
          </van-col>
          <van-col span="12" class="card-info-col">
            <p class="card-info-title">销售门店：</p>
            <p class="card-info-des">{{ item.saleDealerName || '-' }}</p>
          </van-col>
          <van-col span="12" class="card-info-col">
            <p class="card-info-title">交付门店：</p>
            <p class="card-info-des">{{ item.deliveryDealerName || '-' }}</p>
          </van-col>
          <van-col span="12" class="card-info-col">
            <p class="card-info-title">是否锁定：</p>
            <p class="card-info-des">{{ item.lockStatus === 1 ? '未锁定' : '锁定' }}</p>
          </van-col>
          <van-col span="12" class="card-info-col">
            <p class="card-info-title">入库仓库：</p>
            <p class="card-info-des">{{ item.dealerWarehouseName || '-' }}</p>
          </van-col>
        </van-row>
        <div class="btn-content">
          <ais-button
            type="primary"
            plain
            round
            :loading="generatePdiLoading"
            @click="generatePdiClick(item)"
            v-show="
              resourceBtnList.includes('AISMC-storeInventoryLedger-generatePdi')
            "
            >生成在库 PDI 单</ais-button
          >
        </div>
      </div>
    </refresh-list>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onActivated, onDeactivated, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import FilterHeader from '@/libs/components/FilterHeader.vue'
import RefreshList from '@/libs/components/RefreshList.vue'
import AisButton from '@/components/AisButton.vue'

import { getList, generatePdi } from '@/api/inventoryLedger'
import { getVehicleSeriesList, getVehicleModelList, getOwnerTree } from '@/libs/api/common'
import { showFailToast } from 'vant'

defineOptions({
  name: 'InventoryLedgerListView'
})

const route = useRoute()

const filterHeaderRef = ref(null)
const headerPlaceholder = ref('搜索 VIN/车架号')
const searchList = ref([
  // {
  //   title: 'PDI类型',
  //   key: 'vechicleStatus',
  //   default: '',
  //   nodeType: 'single',
  //   options: [
  //     { label: '在途', value: '11' },
  //     { label: '待提交 PDI', value: '20' },
  //     { label: 'PDI 待修复', value: '25' },
  //     { label: '已入门店库', value: '12' },
  //     { label: '销售出库', value: '13' },
  //     { label: '调拨在途', value: '16' },
  //     { label: '作废', value: '99' }
  //   ]
  // },
  {
    title: '车系',
    key: 'seriesIdList',
    default: [],
    nodeType: 'multiple',
    options: [],
    callBack: (res) => changeList(res)
  },
  {
    title: '车型',
    key: 'modelIdList',
    default: [],
    nodeType: 'multiple',
    options: [],
    placeholder: '请先选择车系'
  },
  {
    title: '创建时间',
    key: 'createTime',
    default: [],
    nodeType: 'day',
    columnsType: ['year', 'month', 'day'],
    list: []
  }
  // {
  //   title: '销售门店',
  //   key: 'saleOrgId',
  //   default: [],
  //   nodeType: 'search',
  //   options: [],
  //   placeholder: '请输入门店名称搜索'
  // }
])
const tabList = ['全部车辆', '在库无单车辆', '在途车辆', '异常车辆', '长库存车辆']
const statusList = [10, 20, 30, 40, 50]
const dataList = ref([])
const requestData = reactive({
  data: {
    storeInventoryLedgerTab: '',
    vinLike: '',
    seriesIdList: [],
    modelIdList: [],
    saleOrgId: '',
    createTimeStart: '',
    createTimeEnd: '',
    pageNum: 1,
    pageSize: 10
  },
  api: getList
})
const tempModelIdList = ref([])

const active = ref(0)
const needRefresh = ref(false)

// 滚动位置管理
const scrollPositions = ref({})
const scrollEle = ref(null)
const resourceBtnList = ref([])

// 获取滚动容器元素
const getScrollContainer = () => {
  return scrollEle.value
}

// 保存当前滚动位置
const saveScrollPosition = async() => {
  await nextTick()
  setTimeout(() => {
    const container = getScrollContainer()
    const scrollTop = container ? container.scrollTop : 0
    scrollPositions.value[active.value] = scrollTop
  }, 100)
}

// 恢复滚动位置
const restoreScrollPosition = async() => {
  await nextTick()
  const savedPosition = scrollPositions.value[active.value]
  setTimeout(() => {
    const container = getScrollContainer()
    container.scrollTop = savedPosition || 0
  }, 200)
}

// 组件激活时（从缓存中恢复）调用
onActivated(() => {
  console.log('组件激活')
  const needRefreshFlag = sessionStorage.getItem('needRefresh')
  if (needRefreshFlag) {
    if (filterHeaderRef.value) {
      filterHeaderRef.value.resetFilters()
    }
    requestData.data.vinLike = ''
    requestData.data.pageNum = 1
    dataList.value = []
    requestData.data = { ...requestData.data }
  } else {
    restoreScrollPosition()
  }
})

// 组件失活时（进入缓存）调用
onDeactivated(() => {
  console.log('组件失活')
  saveScrollPosition()
})

onMounted(() => {
  getOwnerTreeList()
  getVehicle()
  // storePage1()
})

// 检查路由参数并处理（从 vehicleInventory 跳转过来）
const checkRouteParams = () => {
  const { seriesId, modelName } = route.query
  if (seriesId) {
    // 设置车系筛选
    requestData.data.seriesIdList = [seriesId]
    requestData.data.pageNum = 1
    dataList.value = []
    // 触发车系变更回调以加载车型列表
    changeList([seriesId], modelName)
  }
}

const headerSearch = (row) => {
  requestData.data.vinLike = row.searchValue
  requestData.data.pageNum = 1
  dataList.value = []
  requestData.data = { ...requestData.data }
}

const resetFilterConditions = () => {
  requestData.data.vinLike = ''
  requestData.data.storeInventoryLedgerTab = ''
  requestData.data.seriesIdList = []
  requestData.data.modelIdList = []
  requestData.data.saleOrgId = ''
  requestData.data.createTimeStart = ''
  requestData.data.createTimeEnd = ''

  if (filterHeaderRef.value) {
    filterHeaderRef.value.resetFilters()
  }

  requestData.data.pageNum = 1
  dataList.value = []
  requestData.data = { ...requestData.data }
}

const filterSearch = (obj) => {
  requestData.data.storeInventoryLedgerTab = obj.vechicleStatus
  requestData.data.seriesIdList = obj.seriesIdList
  const _arr = (obj.modelIdList || []).filter((item) => tempModelIdList.value.includes(item))
  requestData.data.modelIdList = _arr
  requestData.data.saleOrgId = obj.saleOrgId

  if (obj.createTime && obj.createTime.length) {
    requestData.data.createTimeStart = obj.createTime[0].join('-') + ' 00:00:00'
    requestData.data.createTimeEnd = obj.createTime[1].join('-') + ' 23:59:59'
  } else {
    requestData.data.createTimeStart = ''
    requestData.data.createTimeEnd = ''
  }

  requestData.data.pageNum = 1
  dataList.value = []
  requestData.data = { ...requestData.data }
}
// const storePage1 = (storeName) => {
//   storePage({ isWholesaleSale: true, storeName }).then(res => {
//     if (res.code === 200) {
//       const arr = []
//       res.data.records.map((item) => {
//         arr.push({
//           label: item.storeName,
//           value: item.storeId
//         })
//       })
//       searchList.value[4].options = arr
//     } else {
//       searchList.value[4].options = []
//     }
//   }).catch(() => {
//     searchList.value[4].options = []
//   })
// }

// 处理搜索框输入事件（销售门店搜索）
// const handleSearchChange = (obj) => {
//   if (obj.key === 'saleOrgId') {
//     storePage1(obj.keyword)
//   }
// }
// 查询当前用户拥有的所有资源列表
const getOwnerTreeList = () => {
  getOwnerTree({ resourceTag: 'AISVS100005', resourceType: 'APP_SIDE' })
    .then((res) => {
      console.log('getOwnerTree:', res)
      res.data.forEach((item) => {
        resourceBtnList.value.push(item.resourceTag)
      })
    })
    .catch(() => {})
}

const getVehicle = () => {
  getVehicleSeriesList({ pageSize: 200 })
    .then((res) => {
      if (res.code === 200) {
        const arr = []
        res.data.map((item) => {
          arr.push({
            label: item.name,
            value: item.id
          })
        })
        searchList.value[0].options = arr
        // 车系列表加载完成后，检查路由参数
        checkRouteParams()
      } else {
        searchList.value[0].options = []
      }
    })
    .catch(() => {
      searchList.value[0].options = []
    })
}

const changeList = (res, modelName) => {
  if (res.length) {
    const data = {
      seriesIdList: res,
      pageSize: 200
    }
    tempModelIdList.value = []
    getVehicleModelList(data)
      .then((res) => {
        if (res.code === 200) {
          const arr = []
          res.data.map((item) => {
            arr.push({
              label: item.name,
              value: item.id
            })
            tempModelIdList.value.push(item.id)
          })
          searchList.value[1].options = arr

          // 如果有 modelName 参数，查找并设置车型筛选
          if (modelName && arr.length > 0) {
            const targetModel = arr.find((item) => item.label === modelName)
            if (targetModel) {
              // 设置车型筛选
              if (filterHeaderRef.value) {
                filterHeaderRef.value.setFilterValue('modelIdList', [targetModel.value])
              }
              requestData.data.modelIdList = [targetModel.value]
            }
          }

          // 设置车系筛选
          if (filterHeaderRef.value) {
            filterHeaderRef.value.setFilterValue('seriesIdList', res)
          }

          // 触发查询
          requestData.data.pageNum = 1
          dataList.value = []
          requestData.data = { ...requestData.data }
        }
      })
      .catch(() => {
        searchList.value[1].options = []
      })
  } else {
    searchList.value[1].options = []
  }
}

const setData = (res) => {
  if (res.isRefresh) {
    dataList.value = [...res.list]
  } else {
    dataList.value.push(...res.list)
  }
  needRefresh.value = false
}

const generatePdiLoading = ref(false)

const generatePdiClick = (item) => {
  if (generatePdiLoading.value) return
  generatePdiLoading.value = true
  generatePdi(item.id)
    .then((res) => {
      generatePdiLoading.value = false
      if (res.code === 200) {
        showFailToast('PDI执行成功')
        setTimeout(() => {
        // 成功后刷新列表 - 通过改变 refreshFlag 来触发 watch
          dataList.value = []
          requestData.data.refreshFlag = Date.now()
          requestData.data.pageNum = 1
          requestData.data = { ...requestData.data }
        }, 500)
      } else {
        showFailToast(res.message)
      }
    })
    .catch((err) => {
      console.error(err)
      generatePdiLoading.value = false
    })
}

watch(
  () => active.value,
  (newVal) => {
    requestData.data.storeInventoryLedgerTab = statusList[newVal]
    requestData.data.pageNum = 1
  }
)
</script>

<style lang="scss" scoped>
.common-scroll-content {
  flex: 1;
  overflow-y: auto;
  height: calc(100% - 42px);
}
.tab-content {
  width: 100%;
  overflow-x: auto;
  height: 42px;
  overflow-y: hidden;

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
.list-item-content {
  background: #ffffff;
  padding: 12px;
  border-radius: 7px;
  margin-top: 12px;
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .card-title-text {
    font-family: PingFang SC;
    font-size: 16px;
    font-weight: 500;
    color: #191a1b;
  }
  .card-tags {
    display: flex;
    gap: 4px;
  }
  .card-subtitle-text {
    font-family: PingFang SC;
    font-size: 13px;
    color: #545454;
  }
  .card-info {
    box-sizing: border-box;
    background: #fcfbfb;
    margin-top: 8px;
    padding-bottom: 8px;
    .card-info-col {
      font-family: PingFang SC;
      font-size: 12px;
      padding: 8px;
      padding-bottom: 0;
      .card-info-title {
        color: #888888;
        margin-bottom: 2px;
      }
      .card-info-des {
        color: #545454;
      }
    }
  }
  .btn-content {
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
