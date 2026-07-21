<template>
  <filter-header
    ref="filterHeaderRef"
    :placeholder="headerPlaceholder"
    :search-page-route="'PdiSearch'"
    @search="headerSearch"
    :filterList="searchList"
    @filterSearch="filterSearch"
    :showSort="false"
  />
  <div class="tab-content">
    <van-tabs v-model:active="active" sticky>
      <van-tab v-for="(item, index) in tabList" :title="item" :key="index"></van-tab>
    </van-tabs>
  </div>
  <div class="common-scroll-content" ref="scrollEle">
    <refresh-list
      ref="refreshListRef"
      :requestData="requestData"
      :needRefresh="needRefresh"
      :has-no-data="
        dataList.length === 0 &&
        requestData.data &&
        (requestData.data.vehPdiType ||
          requestData.data.seriesIdList?.length ||
          requestData.data.modelIdList?.length ||
          requestData.data.createTimeStart ||
          requestData.data.createTimeEnd ||
          requestData.data.vinLastSix)
      "
      @setData="setData"
      @resetFilters="resetFilterConditions"
    >
      <list-item v-for="(item, index) in dataList" :key="index" :dataItem="item">
        <ais-button
          type="primary"
          plain
          round
          @click="PDIBtnClick(item)"
          v-show="
            (active !== 1 &&
              resourceBtnList.includes('AISVS-storeVehiclePdi-addPdiEntry') &&
              resourceBtnList.includes('AISVS-storeVehiclePdi-getPdiEntryDetails')) ||
            (active === 1 &&
              resourceBtnList.includes('AISVS-storeVehiclePdi-addRepairConfirm') &&
              resourceBtnList.includes('AISVS-storeVehiclePdi-getRepairConfirmDetails'))
          "
          >{{ active === 1 ? '异常修复确认' : 'PDI录入' }}</ais-button
        >
      </list-item>
    </refresh-list>
  </div>
  <ais-dialog :key="dialogKey" :showDialog="showDialog" :dialogObj="dialogObj">
    <p class="dialog-line-text">近期PDI重点关注，漏检产生投诉与损失由门店自担。</p>
    <p class="dialog-line-text">1、车辆网络是否正常必检，播放视频检查网络状态；</p>
    <p class="dialog-line-text">2、座椅皮面是否破损必检，掀开保护套检查后复原；</p>
    <p class="dialog-line-text">3、玻璃表面是否完好必检，检查全车玻璃及屏幕表面；</p>
  </ais-dialog>
</template>

<script setup>
import { onActivated, onDeactivated, reactive, nextTick } from 'vue'

defineOptions({
  name: 'PdiListView'
})

import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FilterHeader from '@/libs/components/FilterHeader.vue'
import RefreshList from '@/libs/components/RefreshList.vue'
import ListItem from '@/components/ListItem.vue'
import AisButton from '@/components/AisButton.vue'
import AisDialog from '@/libs/components/AisDialog.vue'
import { getPdiList, getVehicleModelList, getVehicleSeriesList } from '@/api/pdi'
import { getOwnerTree } from '@/libs/api/common'
const router = useRouter()

const filterHeaderRef = ref(null)
const refreshListRef = ref(null)
const headerPlaceholder = ref('搜索')
const searchList = ref([
  {
    title: 'PDI类型',
    key: 'vehPdiType',
    default: '',
    nodeType: 'single',
    options: [
      { label: '入库PDI', value: '10' },
      { label: '在库PDI', value: '20' }
    ]
  },
  {
    title: '车系',
    key: 'seriesIdList',
    default: [],
    nodeType: 'multiple',
    options: [],
    callBack: (res) => changeList(res)
    // resetDic: { 'modelIdList': [] }
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
])
const tabList = ['入库PDI', 'PDI异常车辆', '在库PDI']
const pdiAppQueryTypeList = [10, 20, 30]
const dataList = ref([])
const requestData = reactive({
  data: {
    pdiAppQueryType: 10,
    vinLastSix: '',
    vehPdiType: '',
    seriesIdList: [],
    modelIdList: [],
    createTimeStart: '',
    createTimeEnd: '',
    pageNum: 1,
    pageSize: 10,
    sortColumns: [{ column: 'create_time', sort: 'DESC' }]
  },
  api: getPdiList
})
const _tempModelIdList = ref([])

const active = ref(0)
const needRefresh = ref(false)
const showDialog = ref(false)
const dialogKey = ref(0) // 添加一个key用于强制重新渲染对话框

// 滚动位置管理
const scrollPositions = ref({}) // 存储每个tab的滚动位置
const dialogObj = {
  id: '',
  vin: '',
  code: '',
  title: '注意事项',
  submitText: '确定',
  cancelText: '取消',
  submitFn: () => dialogSubmitFn(),
  cancelFn: () => dialogCancelFn()
}

const scrollEle = ref(null)
const resourceBtnList = ref([]) // 按钮资源数组

// 获取滚动容器元素
const getScrollContainer = () => {
  return scrollEle.value
}

// 保存当前滚动位置
const saveScrollPosition = async() => {
  await nextTick() // 确保DOM更新完成
  // 使用 setTimeout 确保在下一个事件循环中获取元素尺寸
  setTimeout(() => {
    const container = getScrollContainer()
    // 检查容器是否存在且有滚动属性
    const scrollTop = container ? container.scrollTop : 0
    scrollPositions.value[active.value] = scrollTop
  }, 100) // 增加延时以确保滚动容器完全渲染
}

// 恢复滚动位置
const restoreScrollPosition = async() => {
  await nextTick() // 等待DOM更新完成
  const savedPosition = scrollPositions.value[active.value]
  // 延迟执行以确保内容已渲染
  setTimeout(() => {
    const container = getScrollContainer()
    container.scrollTop = savedPosition || 0
  }, 200) // 增加延时以确保内容完全渲染
}

// 组件激活时（从缓存中恢复）调用
onActivated(() => {
  console.log('组件激活')
  // 当组件从缓存中激活时，确保对话框不显示
  // 使用 nextTick 确保DOM更新后再设置
  setTimeout(() => {
    showDialog.value = false
    // 更新key以强制重新渲染对话框组件
    dialogKey.value += 1
    const needRefresh = sessionStorage.getItem('needRefresh')
    if (needRefresh) {
      sessionStorage.removeItem('needRefresh')
      // 直接调 RefreshList 的 reset() 强制刷新，绕开 isSearchParamsEqual 的相等性短路
      refreshListRef.value?.reset()
    } else {
      // 如果不需要刷新数据，则恢复滚动位置
      restoreScrollPosition()
    }
  }, 0)
})

// 组件失活时（进入缓存）调用
onDeactivated(() => {
  console.log('组件失活')
  // 在组件失活前，确保对话框关闭，避免缓存时保持打开状态
  showDialog.value = false
  // 更新key以确保下次激活时重新渲染对话框
  dialogKey.value += 1
})

onMounted(() => {
  getOwnerTreeList()
  getVehicle()
})

const headerSearch = (row) => {
  requestData.data.vinLastSix = row.searchValue
  requestData.data.pageNum = 1
  dataList.value = []
  // 强制触发刷新，通过创建新的data对象来确保响应式更新
  requestData.data = { ...requestData.data }
}

const resetFilterConditions = () => {
  // 重置搜索条件
  requestData.data.vinLastSix = ''

  // 重置筛选条件
  requestData.data.vehPdiType = ''
  requestData.data.seriesIdList = []
  requestData.data.modelIdList = []
  requestData.data.createTimeStart = ''
  requestData.data.createTimeEnd = ''

  // 重置 FilterHeader 组件的状态
  if (filterHeaderRef.value) {
    filterHeaderRef.value.resetFilters()
  }

  // 重置分页
  requestData.data.pageNum = 1
  dataList.value = []

  // 强制触发刷新
  requestData.data = { ...requestData.data }

  // 触发一次搜索以刷新数据
  headerSearch({ searchValue: '', sortOrder: false })
}

const filterSearch = (obj) => {
  requestData.data.vehPdiType = obj.vehPdiType
  requestData.data.seriesIdList = obj.seriesIdList
  console.log('obj', obj.modelIdList)
  console.log('modelIdList', _tempModelIdList.value)
  const _arr = obj.modelIdList.filter((item) => _tempModelIdList.value.includes(item))
  console.log('_arr', _arr)
  // requestData.data.modelIdList = obj.modelIdList
  requestData.data.modelIdList = _arr
  if (obj.createTime && obj.createTime.length) {
    requestData.data.createTimeStart = obj.createTime[0].join('-') + ' 00:00:00'
    requestData.data.createTimeEnd = obj.createTime[1].join('-') + ' 23:59:59'
  } else {
    requestData.data.createTimeStart = ''
    requestData.data.createTimeEnd = ''
  }
  requestData.data.pageNum = 1
  dataList.value = []
  // 强制触发刷新，通过创建新的data对象来确保响应式更新
  requestData.data = { ...requestData.data }
}
// 查询当前用户拥有的所有资源列表
const getOwnerTreeList = () => {
  getOwnerTree({ resourceTag: 'AISVS100001', resourceType: 'APP_SIDE' })
    .then((res) => {
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
        searchList.value[1].options = arr
      } else {
        searchList.value[1].options = []
      }
    })
    .catch(() => {
      searchList.value[1].options = []
    })
}

const changeList = (res) => {
  if (res.length) {
    const data = {
      seriesIdList: res,
      pageSize: 200
    }
    _tempModelIdList.value = []
    getVehicleModelList(data)
      .then((res) => {
        if (res.code === 200) {
          const arr = []
          res.data.map((item) => {
            arr.push({
              label: item.name,
              value: item.id
            })
            _tempModelIdList.value.push(item.id)
          })
          searchList.value[2].options = arr
        }
      })
      .catch(() => {
        searchList.value[2].options = []
      })
  } else {
    searchList.value[2].options = []
  }
}

const setData = (res) => {
  console.log('set', res)
  if (res.isRefresh) {
    dataList.value = [...res.list]
  } else {
    dataList.value.push(...res.list)
  }
  needRefresh.value = false
  console.log(dataList.value)
}

const PDIBtnClick = (item) => {
  dialogObj.id = item.id
  dialogObj.vin = item.vin
  dialogObj.code = item.code
  showDialog.value = true
}

const dialogSubmitFn = async() => {
  await saveScrollPosition()
  setTimeout(() => {
    // 跳转到详情页
    showDialog.value = false
    const type = active.value === 1 ? 'repair' : 'detail'
    router.push({
      path: '/pdi/detail',
      query: {
        id: dialogObj.id,
        vin: dialogObj.vin,
        code: dialogObj.code,
        type
      }
    })
  }, 200)
}

const dialogCancelFn = () => {
  showDialog.value = false
}

watch(
  () => active.value,
  (newVal) => {
    requestData.data.pdiAppQueryType = pdiAppQueryTypeList[newVal]
    requestData.data.pageNum = 1
  }
)
</script>

<style lang="scss" scoped>
.common-scroll-content {
  flex: 1;
  overflow-y: auto;

  .tab-content {
    width: 100%;
    overflow-x: auto;
    height: 42px;
    overflow-y: hidden;
  }
}

.dialog-line-text {
  font-family: "PingFang SC", sans-serif;
  font-size: 14px;
  letter-spacing: 0.43px;
  color: #545454;
}
</style>
