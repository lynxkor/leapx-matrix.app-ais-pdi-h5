<template>
  <filter-header
    :placeholder="headerPlaceholder"
    :search-page-route="'AbnormalRecordSearch'"
    @search="headerSearch"
    @filterSearch="filterSearch"
    :showFilter="false"
    :showSort="false"
  />
  <div class="common-scroll-content">
    <refresh-list :requestData="requestData" :needRefresh="needRefresh" @setData="setData">
      <div v-for="(item, index) in dataList" :key="index" class="list-item-content">
        <!-- VIN 和电量标签同行 -->
        <div class="title-row">
          <div class="card-title-text">{{ item.vin }}</div>
          <div class="battery-tag-row">
            <span class="battery-tag" :class="`battery-tag--${getBatteryColorStatus(item.electricity)}`">
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
            <p class="card-info-title">是否匹配订单：</p>
            <p class="card-info-des">{{ item.lockStatusLabel }}</p>
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
    </refresh-list>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'

defineOptions({
  name: 'VehicleAbnormalRecordListView'
})

import FilterHeader from '@/libs/components/FilterHeader.vue'
import RefreshList from '@/libs/components/RefreshList.vue'

import { getList } from '@/api/abnormalRecord'

const headerPlaceholder = ref('请输入车辆 VIN 后六位')

const dataList = ref([])
const requestData = reactive({
  data: {
    vin: '',
    pageNum: 1,
    pageSize: 20,
    sortColumns: [{ column: 'create_time', sort: 'DESC' }]
  },
  api: getList
})

const needRefresh = ref(false)

const headerSearch = (row) => {
  requestData.data.vin = row.searchValue
  requestData.data.pageNum = 1
  dataList.value = []
  // 强制触发刷新
  requestData.data = { ...requestData.data }
}

const filterSearch = () => {
  requestData.data.pageNum = 1
  dataList.value = []
  requestData.data = { ...requestData.data }
}

const setData = (res) => {
  // 为每条数据添加锁状态标签
  const processedList = res.list.map(item => ({
    ...item,
    lockStatusLabel: item.lockStatus === 0 ? '否' : '是'
  }))

  if (res.isRefresh) {
    dataList.value = [...processedList]
  } else {
    dataList.value.push(...processedList)
  }
  needRefresh.value = false
}

// 格式化电量显示
const formatElectricity = (electricity) => {
  if (electricity === null || electricity === undefined) return 0
  // 如果电量值 >= 1，说明是百分比形式，直接取整
  // 如果电量值 < 1，说明是小数形式，转换为百分比
  return electricity >= 1 ? Math.round(electricity) : Math.round(electricity * 100)
}

// 获取电池电量百分比（用于样式）
const getBatteryLevel = (electricity) => {
  if (electricity === null || electricity === undefined) return 0
  const percent = electricity >= 1 ? electricity : electricity * 100
  return percent
}

// 获取电池标签颜色状态：<5 红色，<15 橙色，其他绿色
const getBatteryColorStatus = (electricity) => {
  if (electricity === null || electricity === undefined) return 'danger'
  const percent = electricity >= 1 ? electricity : electricity * 100
  if (percent < 5) return 'danger'
  if (percent < 15) return 'warning'
  return 'success'
}

onMounted(() => {
  // 初始化逻辑
})
</script>

<style lang="scss" scoped>
.common-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: var(--leap-color-default-light-5);
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

        &--danger {
          background: #F8E8E8;
          color: var(--leap-color-danger);
          .battery-outline { color: var(--leap-color-danger); }
          &::before { background: var(--leap-color-danger); }
          .days { color: var(--leap-color-danger); }
        }

        &--warning {
          background: #F8E9E2;
          color: #E6A23C;
          .battery-outline { color: #E6A23C; }
          &::before { background: #E6A23C; }
          .days { color: #E6A23C; }
        }

        &--success {
          background: #E8F5E8;
          color: #67C23A;
          .battery-outline { color: #67C23A; }
          &::before { background: #67C23A; }
          .days { color: #67C23A; }
        }

        .battery-icon {
          position: relative;
          display: inline-block;
          width: 18px;
          height: 18px;
          margin-right: 4px;

          .battery-outline {
            width: 100%;
            height: 100%;
          }

          &::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 5px;
            width: calc(var(--battery-level) * 0.1px);
            height: 6px;
            border-radius: 1px;
            transform: translateY(-50%);
          }
        }

        .divider {
          margin: 0 4px;
          opacity: 0.4;
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
        color:var(--leap-color-default-light-2);
        margin-bottom: 2px;
      }

      .card-info-des {
        color: var(--leap-color-default-light-1);
      }
    }
  }
}
</style>
