<template>
  <filter-header
    ref="filterHeaderRef"
    :placeholder="headerPlaceholder"
    :search-page-route="'VdcInventorySearch'"
    @search="headerSearch"
    :filterList="searchList"
    @filterSearch="filterSearch"
    :showSort="false"
  />
  <div class="sticky-header">
    <div class="inventory-header">
      <span class="header-materials">物料描述</span>
      <div class="header-resource">
        <span class="header-item">库存</span>
        <span class="header-item">生产</span>
        <span class="header-item">排产</span>
      </div>
    </div>
  </div>
  <div class="common-scroll-content" ref="scrollEle">
    <refresh-list
      :requestData="requestData"
      :needRefresh="needRefresh"
      :has-no-data="
        dataList.length === 0 &&
        requestData.data &&
        (requestData.data.seriesIds?.length ||
          requestData.data.modelIds?.length ||
          requestData.data.yearTypeIds?.length ||
          requestData.data.exteriorIds?.length ||
          requestData.data.interiorIds?.length ||
          requestData.data.wheelHubIds?.length ||
          requestData.data.optionPackageIds?.length ||
          requestData.data.materialsDescLike ||
          requestData.data.materialsCodeLike)
      "
      @setData="setData"
      @resetFilters="resetFilterConditions"
    >
      <div class="inventory-list">
        <div class="inventory-item" v-for="(item, index) in dataList" :key="index">
          <div class="materials-desc">{{ item.materialsDesc }}</div>
          <div class="resource-row">
            <div class="resource-item">
              <div class="resource-content">
                <span class="dot-badge" :style="{ backgroundColor: getResourceColor(item.inventoryResource) }"></span>
                <span class="resource-desc" :class="getResourceClass(item.inventoryResource)">{{ item.inventoryResourceLabel}}</span>
              </div>
            </div>
            <div class="resource-item">
              <div class="resource-content">
                <span class="dot-badge" :style="{ backgroundColor: getResourceColor(item.productionInProgressResource) }"></span>
                <span class="resource-desc" :class="getResourceClass(item.productionInProgressResource)">{{ item.productionInProgressResourceLabel }}</span>
              </div>
            </div>
            <div class="resource-item">
              <div class="resource-content">
                <span class="dot-badge" :style="{ backgroundColor: getResourceColor(item.productionScheduledResource) }"></span>
                <span class="resource-desc" :class="getResourceClass(item.productionScheduledResource)">{{ item.productionScheduledResourceLabel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </refresh-list>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onActivated, onDeactivated, nextTick } from 'vue'
import FilterHeader from '@/libs/components/FilterHeader.vue'
import RefreshList from '@/libs/components/RefreshList.vue'

import { getList } from '@/api/vdcInventory'
import {
  getVehicleSeriesList,
  getVehicleModelList,
  getVehicleExterior,
  getVehicleInterior,
  getVehicleWheelHub,
  getVehicleOptionPackage,
  getVehicleModelYearTypeRelationDistinctYeayType
} from '@/libs/api/common'

defineOptions({
  name: 'VehicleVdcInventoryStatisticsListView'
})

const filterHeaderRef = ref(null)
const headerPlaceholder = ref('搜索物料描述、物料编码')
const searchList = ref([
  {
    title: '车系',
    key: 'seriesIdList',
    default: [],
    nodeType: 'multiple',
    options: [],
    callBack: (res) => loadVehicleModels(res)
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
    title: '年款',
    key: 'yearTypeIdList',
    default: [],
    nodeType: 'multiple',
    options: [],
    placeholder: '请选择年款'
  },
  {
    title: '外观',
    key: 'exteriorIdList',
    default: [],
    nodeType: 'multiple',
    options: [],
    placeholder: '请选择外观'
  },
  {
    title: '内饰',
    key: 'interiorIdList',
    default: [],
    nodeType: 'multiple',
    options: [],
    placeholder: '请选择内饰'
  },
  {
    title: '轮毂',
    key: 'wheelHubIdList',
    default: [],
    nodeType: 'multiple',
    options: [],
    placeholder: '请选择轮毂'
  },
  {
    title: '选装包',
    key: 'optionPackageIdList',
    default: [],
    nodeType: 'multiple',
    options: [],
    placeholder: '请选择选装包'
  }
])
const dataList = ref([])
const requestData = reactive({
  data: {
    pageNum: 1,
    pageSize: 20,
    seriesIds: [],
    modelIds: [],
    yearTypeIds: [],
    exteriorIds: [],
    interiorIds: [],
    wheelHubIds: [],
    optionPackageIds: [],
    materialsDescLike: '',
    materialsCodeLike: ''
  },
  api: getList
})

const active = ref(0)
const needRefresh = ref(false)

// 滚动位置管理
const scrollPositions = ref({})
const scrollEle = ref(null)

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
    requestData.data.materialsDescLike = ''
    requestData.data.materialsCodeLike = ''
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
  getVehicle()
  loadYearTypes()
  loadExteriors()
  loadInteriors()
  loadWheelHubs()
  loadOptionPackages()
})

const headerSearch = (row) => {
  // 根据搜索内容判断是物料描述还是物料编码
  const searchValue = row.searchValue || ''
  // 简单判断：如果是纯数字或字母组合，可能是物料编码
  if (/^[A-Z0-9]+$/i.test(searchValue)) {
    requestData.data.materialsCodeLike = searchValue
  } else {
    requestData.data.materialsDescLike = searchValue
  }
  requestData.data.pageNum = 1
  dataList.value = []
  requestData.data = { ...requestData.data }
}

const resetFilterConditions = () => {
  requestData.data.materialsDescLike = ''
  requestData.data.materialsCodeLike = ''
  requestData.data.seriesIds = []
  requestData.data.modelIds = []
  requestData.data.yearTypeIds = []
  requestData.data.exteriorIds = []
  requestData.data.interiorIds = []
  requestData.data.wheelHubIds = []
  requestData.data.optionPackageIds = []

  if (filterHeaderRef.value) {
    filterHeaderRef.value.resetFilters()
  }

  requestData.data.pageNum = 1
  dataList.value = []
  requestData.data = { ...requestData.data }
}

const filterSearch = (obj) => {
  requestData.data.seriesIds = obj.seriesIdList
  requestData.data.modelIds = obj.modelIdList || []
  requestData.data.yearTypeIds = obj.yearTypeIdList || []
  requestData.data.exteriorIds = obj.exteriorIdList || []
  requestData.data.interiorIds = obj.interiorIdList || []
  requestData.data.wheelHubIds = obj.wheelHubIdList || []
  requestData.data.optionPackageIds = obj.optionPackageIdList || []

  requestData.data.pageNum = 1
  dataList.value = []
  requestData.data = { ...requestData.data }
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
      } else {
        searchList.value[0].options = []
      }
    })
    .catch(() => {
      searchList.value[0].options = []
    })
}

const loadVehicleModels = (seriesIdList) => {
  if (!seriesIdList || !seriesIdList.length) {
    searchList.value[1].options = []
    return
  }
  const data = {
    seriesIdList: seriesIdList,
    pageSize: 200
  }
  getVehicleModelList(data)
    .then((res) => {
      if (res.code === 200) {
        const arr = []
        res.data.map((item) => {
          arr.push({
            label: item.name,
            value: item.id
          })
        })
        searchList.value[1].options = arr
      } else {
        searchList.value[1].options = []
      }
    })
    .catch(() => {
      searchList.value[1].options = []
    })
}

// 加载年款列表
const loadYearTypes = () => {
  getVehicleModelYearTypeRelationDistinctYeayType({ pageSize: 200 })
    .then((res) => {
      if (res.code === 200) {
        const arr = []
        res.data.map((item) => {
          arr.push({
            label: item.yearTypeName,
            value: item.yearTypeId
          })
        })
        searchList.value[2].options = arr
      } else {
        searchList.value[2].options = []
      }
    })
    .catch(() => {
      searchList.value[2].options = []
    })
}

// 加载外观列表
const loadExteriors = () => {
  getVehicleExterior({ pageSize: 200 })
    .then((res) => {
      if (res.code === 200) {
        const arr = []
        res.data.map((item) => {
          arr.push({
            label: item.name,
            value: item.id
          })
        })
        searchList.value[3].options = arr
      } else {
        searchList.value[3].options = []
      }
    })
    .catch(() => {
      searchList.value[3].options = []
    })
}

// 加载内饰列表
const loadInteriors = () => {
  getVehicleInterior({ pageSize: 200 })
    .then((res) => {
      if (res.code === 200) {
        const arr = []
        res.data.map((item) => {
          arr.push({
            label: item.name,
            value: item.id
          })
        })
        searchList.value[4].options = arr
      } else {
        searchList.value[4].options = []
      }
    })
    .catch(() => {
      searchList.value[4].options = []
    })
}

// 加载轮毂列表
const loadWheelHubs = () => {
  getVehicleWheelHub({ pageSize: 200 })
    .then((res) => {
      console.log('轮毂 API 响应:', res)
      if (res.code === 200) {
        const arr = []
        res.data.map((item) => {
          arr.push({
            label: item.name,
            value: item.id
          })
        })
        console.log('轮毂数据:', arr)
        searchList.value[5].options = arr
      } else {
        console.log('轮毂 API 返回错误:', res)
        searchList.value[5].options = []
      }
    })
    .catch((err) => {
      console.log('轮毂 API 请求失败:', err)
      searchList.value[5].options = []
    })
}

// 加载选装包列表
const loadOptionPackages = () => {
  getVehicleOptionPackage({ pageSize: 200 })
    .then((res) => {
      if (res.code === 200) {
        const arr = []
        res.data.map((item) => {
          arr.push({
            label: item.name,
            value: item.id
          })
        })
        searchList.value[6].options = arr
      } else {
        searchList.value[6].options = []
      }
    })
    .catch(() => {
      searchList.value[6].options = []
    })
}

const setData = (res) => {
  console.log('set', res)
  // 接口返回格式：{ code: 200, data: [] }
  let list = []

  if (Array.isArray(res)) {
    // 如果直接是数组
    list = res
  } else if (res && Array.isArray(res.data)) {
    // 如果是 { code: 200, data: [] } 格式
    list = res.data
  } else if (res && res.list) {
    // 如果是 { list: [...], isRefresh: true } 格式
    list = res.list
  }

  // 根据是否刷新决定是替换还是累加数据
  if (res.isRefresh) {
    // 刷新时替换数据
    dataList.value = [...list]
  } else {
    // 加载更多时累加数据
    dataList.value = [...dataList.value, ...list]
  }
  needRefresh.value = false
  console.log('dataList:', dataList.value)
}

// 获取资源颜色
const getResourceColor = (type) => {
  switch (type) {
    case 1010: // 无
      return '#ccc'
    case 1020: // 极少
      return '#E30808'
    case 1030: // 少量
      return '#FFA400'
    case 1040: // 充足
      return '#00AA00'
    default:
      return '#ccc'
  }
}

// 获取资源样式类
const getResourceClass = (type) => {
  switch (type) {
    case 1040:
      return 'sufficient' // 充足
    case 1030:
      return 'low' // 少量
    case 1020:
      return 'scarce' // 极少
    case 1010:
      return 'none' // 无
    default:
      return ''
  }
}
</script>

<style lang="scss" scoped>
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

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
</style>
