<template>
    <filter-header
        :placeholder="headerPlaceholder"
        @search="headerSearch"
        :searchList="searchList"
        @filterSearch="filterSearch"
        :showSort="true"
    />
    <div class="common-scroll-content">
        <!-- <div v-for="(_, index) in 100" :key="index" style="height: 4rem;">pdi列表</div> -->
        <refresh-list></refresh-list>
    </div>
</template>

<script setup>
  import { ref } from 'vue'
  import FilterHeader from '@/libs/components/FilterHeader.vue'
  import RefreshList from '@/libs/components/RefreshList.vue'

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
        title: '状态多选',
        key: 'pdiResultMultiple',
        default: ['10', '11'],
        nodeType: 'multiple',
        options: [
            { label: '多选1', value: '10' },
            { label: '多选2', value: '11' },
            { label: '多选3', value: '12' }
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
        default: [['11','11'], ['52','46']],
        nodeType: 'minute',
        columnsType: ['minute', 'second'],
        list: [
        ]
    },
    {
        title: '时分秒',
        key: 'secondTime',
        default: [['01','11','11'], ['22','12','46']],
        nodeType: 'second',
        columnsType: ['hour', 'minute', 'second'],
        list: [
        ]
    }
  ])

  const headerSearch = (row) => {
      console.log(row)
  }
  
  const filterSearch = (obj) => {
    console.log(obj)
  }

</script>

<style lang="scss" scoped>
    .common-scroll-content{
        flex: 1;
        overflow-y: auto;
    }
</style>
