<template>
    <filter-header
        :placeholder="headerPlaceholder"
        @search="headerSearch"
        :searchList="searchList"
        @filterSearch="filterSearch"
        :showSort="false"
    />
    <div class="common-scroll-content">
      <refresh-list @setData="setData">
        <list-item v-for="(item, index) in dataList" :key="index" :dataItem="item"></list-item>
      </refresh-list>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import FilterHeader from '@/libs/components/FilterHeader.vue'
import RefreshList from '@/libs/components/RefreshList.vue'
import ListItem from '@/components/ListItem.vue'

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
const dataList = ref([])

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

</script>

<style lang="scss" scoped>
    .common-scroll-content{
        flex: 1;
        overflow-y: auto;
    }
</style>
