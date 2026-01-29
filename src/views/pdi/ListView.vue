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
      <refresh-list @setData="setData">
        <list-item v-for="(item, index) in dataList" :key="index" :dataItem="item">
          <ais-button type="primary" plain round @click="PDIBtnClick(item, index)">PDI录入</ais-button>
        </list-item>
      </refresh-list>
    </div>
    <ais-dialog :showDialog="showDialog" :dialogObj="dialogObj">
      <p class="dialog-line-text">1、检查时请不要插拔任何高压线束；</p>
      <p class="dialog-line-text">2、对“制动性”和“行驶性”的检查可以在车辆移动中进行；</p>
      <p class="dialog-line-text">3、车辆到店需检查是否需要更新车机版本，如需升级，先完成OTA再入库；</p>
      <p class="dialog-line-text">4、车辆PDI过程中需通过诊断仪完成“交付模式”退出</p>
    </ais-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import FilterHeader from '@/libs/components/FilterHeader.vue'
import RefreshList from '@/libs/components/RefreshList.vue'
import ListItem from '@/components/ListItem.vue'
import AisButton from '@/components/AisButton.vue'
import AisDialog from '@/libs/components/AisDialog.vue'

const router = useRouter()

const headerPlaceholder = ref('搜索')
const searchList = ref([
  {
    title: '检查状态',
    key: 'pdiResult',
    default: '0',
    nodeType: 'single',
    options: [
      { label: '待执行', value: '0' },
      { label: '通过', value: '1' },
      { label: '不通过', value: '2' }
    ]
  },
  {
    title: '车型',
    key: 'pdiResultMultiple',
    default: ['10', '11'],
    nodeType: 'multiple',
    options: [
      { label: '车型1', value: '01' },
      { label: '车型2', value: '02' },
      { label: '车型3', value: '03' }
    ],
    callBack: (res) => changeList(res),
    resetDic: { 'carSeries': [] }
  },
  {
    title: '车系',
    key: 'carSeries',
    default: [],
    nodeType: 'multiple',
    options: [
      // { label: '车系1', value: '10' },
      // { label: '车系2', value: '11' },
      // { label: '车系3', value: '12' }
    ]
  },
  {
    title: '年',
    key: 'orderTime',
    default: [],
    // default: [['2024'], ['2033']],
    nodeType: 'year',
    columnsType: ['year'],
    list: [
      { label: '去年', value: 'year01' },
      { label: '今年', value: 'year02' },
      { label: '明年', value: 'year03' }
    ]
  },
  {
    title: '月',
    key: 'createTime',
    // default: [],
    default: [['2024', '01'], ['2026', '11']],
    nodeType: 'month',
    columnsType: ['year', 'month'],
    list: [
      { label: '上个月', value: 'month01' },
      { label: '当月', value: 'month02' },
      { label: '下个月', value: 'month03' }
    ]
  },
  {
    title: '日',
    key: 'updateTime',
    // default: [['2024', '01', '02'], ['2026', '11', '19']],
    default: [],
    nodeType: 'day',
    columnsType: ['year', 'month', 'day'],
    list: [
      { label: '昨天', value: 'day01' },
      { label: '今天', value: 'day02' },
      { label: '明天', value: 'day03' }
    ]
  },
  {
    title: '小时分钟',
    key: 'hourTime',
    default: [['02', '12'], ['23', '59']],
    nodeType: 'hour',
    columnsType: ['hour', 'minute'],
    list: [
    ]
  },
  {
    title: '分钟秒',
    key: 'minuteTime',
    default: [['11', '11'], ['52', '46']],
    nodeType: 'minute',
    columnsType: ['minute', 'second'],
    list: [
    ]
  },
  {
    title: '时分秒',
    key: 'secondTime',
    default: [['01', '11', '11'], ['22', '12', '46']],
    nodeType: 'second',
    columnsType: ['hour', 'minute', 'second'],
    list: [
    ]
  }
])
const tabList = ['入库PDI', 'PDI异常车辆', '在库PDI']
const dataList = ref([])

const active = ref(0)
const showDialog = ref(false)
const dialogObj = {
  index: '',
  title: '注意事项',
  submitText: '确定',
  cancelText: '取消',
  submitFn: () => dialogSubmitFn(),
  cancelFn: () => dialogCancelFn()
}

const headerSearch = (row) => {
  console.log(row)
}

const filterSearch = (obj) => {
  console.log(obj)
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

const setData = res => {
  dataList.value = res
}

const PDIBtnClick = (item, index) => {
  showDialog.value = true
  console.log(index)
  dialogObj.index = index
}

const dialogSubmitFn = () => {
  // 跳转到详情页
  showDialog.value = false
  console.log('index', dialogObj.index)
  router.push({
    path: '/pdi/detail',
    query: {
      index: dialogObj.index,
      name: 'name111'
    }
  })
}

const dialogCancelFn = () => {
  showDialog.value = false
}

watch(
  () => active.value,
  newVal => {
    console.log('tab类型变化，需要重新加载', newVal)
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
