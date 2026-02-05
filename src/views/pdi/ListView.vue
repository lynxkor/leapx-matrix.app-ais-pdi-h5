<template>
    <filter-header
        :placeholder="headerPlaceholder"
        @search="headerSearch"
        :searchList="searchList"
        @filterSearch="filterSearch"
        :showSort="false"
    />
    <div class="tab-content">
      <van-tabs v-model:active="active" sticky >
        <van-tab v-for="(item, index) in tabList" :title="item" :key="index"></van-tab>
      </van-tabs>
    </div>
    <div class="common-scroll-content">
      <refresh-list :requestData="requestData" :needRefresh="needRefresh" @setData="setData">
        <list-item v-for="(item, index) in dataList" :key="index" :dataItem="item">
          <ais-button type="primary" plain round @click="PDIBtnClick(item)">{{ active === 1 ? '异常修复确认' : 'PDI录入' }}</ais-button>
        </list-item>
      </refresh-list>
    </div>
    <ais-dialog :key="dialogKey" :showDialog="showDialog" :dialogObj="dialogObj">
      <p class="dialog-line-text">1、检查时请不要插拔任何高压线束；</p>
      <p class="dialog-line-text">2、对"制动性"和"行驶性"的检查可以在车辆移动中进行；</p>
      <p class="dialog-line-text">3、车辆到店需检查是否需要更新车机版本，如需升级，先完成OTA再入库；</p>
      <p class="dialog-line-text">4、车辆PDI过程中需通过诊断仪完成"交付模式"退出</p>
    </ais-dialog>
</template>

<script setup>
import { defineOptions, onActivated, onDeactivated, reactive } from 'vue'

defineOptions({
  name: 'PdiListView'
})

import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import FilterHeader from '@/libs/components/FilterHeader.vue'
import RefreshList from '@/libs/components/RefreshList.vue'
import ListItem from '@/components/ListItem.vue'
import AisButton from '@/components/AisButton.vue'
import AisDialog from '@/libs/components/AisDialog.vue'

import { getPdiList } from '@/api/pdi'

const router = useRouter()

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
    options: [
      // { label: '车系1', value: '10' },
      // { label: '车系2', value: '11' },
      // { label: '车系3', value: '12' }
    ],
    callBack: (res) => changeList(res),
    resetDic: { 'modelIdList': [] }
  },
  {
    title: '车型',
    key: 'modelIdList',
    default: [],
    nodeType: 'multiple',
    options: [
      // { label: '车型1', value: '01' },
      // { label: '车型2', value: '02' },
      // { label: '车型3', value: '03' }
    ]
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
    pageSize: 10
  },
  api: getPdiList
})

const active = ref(0)
const needRefresh = ref(false)
const showDialog = ref(false)
const dialogKey = ref(0) // 添加一个key用于强制重新渲染对话框
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

// 组件激活时（从缓存中恢复）调用
onActivated(() => {
  console.log('组件激活')
  // 当组件从缓存中激活时，确保对话框不显示
  // 使用 nextTick 确保DOM更新后再设置
  setTimeout(() => {
    showDialog.value = false
    // 更新key以强制重新渲染对话框组件
    dialogKey.value += 1
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

const headerSearch = (row) => {
  requestData.data.vinLastSix = row.searchValue
  requestData.data.pageNum = 1
  dataList.value = []
  // 强制触发刷新，通过创建新的data对象来确保响应式更新
  requestData.data = { ...requestData.data }
}

const filterSearch = (obj) => {
  requestData.data.vehPdiType = obj.vehPdiType
  requestData.data.seriesIdList = obj.seriesIdList
  requestData.data.modelIdList = obj.modelIdList
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

const changeList = (res) => {
  if (res.includes('01')) {
    searchList.value[2].options = [
      { label: '车系1', value: '01' },
      { label: '车系2', value: '02' },
      { label: '车系3', value: '03' }
    ]
  } else {
    searchList.value[2].options = [
      { label: '车系4', value: '04' },
      { label: '车系5', value: '05' },
      { label: '车系6', value: '06' }
    ]
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

const PDIBtnClick = (item) => {
  dialogObj.id = item.id
  dialogObj.vin = item.vin
  dialogObj.code = item.code
  showDialog.value = true
}

const dialogSubmitFn = () => {
  // 跳转到详情页
  showDialog.value = false
  // 更新key以确保对话框被重新渲染
  dialogKey.value += 1
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
}

const dialogCancelFn = () => {
  showDialog.value = false
}

watch(
  () => active.value,
  newVal => {
    requestData.data.pdiAppQueryType = pdiAppQueryTypeList[newVal]
    requestData.data.pageNum = 1
  }
)

</script>

<style lang="scss" scoped>
  .common-scroll-content{
    flex: 1;
    overflow-y: auto;
    .tab-content{
      width: 100%;
      overflow-x: auto;
      height: 42px;
      overflow-y: hidden;
    }
  }
  .dialog-line-text{
    font-family: PingFang SC;
    font-size: 14px;
    letter-spacing: 0.43px;
    color: #545454;
  }
</style>
