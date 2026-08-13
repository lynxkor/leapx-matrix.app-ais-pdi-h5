<template>
  <div class="list-item-content">
    <div class="card-header">
      <div class="card-title-text">{{ dataItem.vin }}</div>
      <!-- <div class="card-tags">
        <van-tag v-if="dataItem.vechicleStatusLabel" type="primary">{{ dataItem.vechicleStatusLabel }}</van-tag>
        <van-tag v-if="dataItem.reserved === 1" type="success">预留</van-tag>
        <van-tag v-if="dataItem.lockStatus === 1" type="warning">锁定</van-tag>
      </div> -->
    </div>
    <div class="card-subtitle-text">
      {{ dataItem.materialsDesc || dataItem.modelName }} | {{ dataItem.exteriorName }} | {{ dataItem.interiorName }}
    </div>
    <van-row class="card-info">
      <van-col span="12" class="card-info-col">
        <p class="card-info-title">基本车型：</p>
        <p class="card-info-des">{{ dataItem.modelName || '-' }}</p>
      </van-col>
      <van-col span="12" class="card-info-col">
        <p class="card-info-title">是否预留：</p>
        <p class="card-info-des">{{ dataItem.reserved === 1 ? '是' : '否' }}</p>
      </van-col>
      <van-col span="12" class="card-info-col">
        <p class="card-info-title">销售门店：</p>
        <p class="card-info-des">{{ dataItem.saleDealerName || '-' }}</p>
      </van-col>
      <van-col span="12" class="card-info-col">
        <p class="card-info-title">交付门店：</p>
        <p class="card-info-des">{{ dataItem.deliveryDealerName || '-' }}</p>
      </van-col>
      <van-col span="12" class="card-info-col">
        <p class="card-info-title">是否匹配订单：</p>
        <p class="card-info-des">{{ dataItem.lockStatus === 1 ? '是' : '否' }}</p>
      </van-col>
      <van-col span="12" class="card-info-col">
        <p class="card-info-title">入库仓库：</p>
        <p class="card-info-des">{{ dataItem.dealerWarehouseName || '-' }}</p>
      </van-col>
      <van-col span="12" class="card-info-col" v-show="active === 0">
        <p class="card-info-title">PDI提交截止时间：</p>
        <p class="card-info-des">{{ dataItem.pdiLatestDate || '-' }}</p>
      </van-col>
    </van-row>
    <div class="btn-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  dataItem: {
    type: Object,
    default: () => {
      return {}
    }
  },
  active: {
    type: Number
  }
})
</script>

<style lang="scss" scoped>
.list-item-content {
  background: #fff;
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
    font-family: "PingFang SC", sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #191a1b;
  }

  .card-tags {
    display: flex;
    gap: 4px;
  }

  .card-subtitle-text {
    font-family: "PingFang SC", sans-serif;
    font-size: 13px;
    color: #545454;
  }

  .card-info {
    box-sizing: border-box;
    background: #fcfbfb;
    margin-top: 8px;
    padding-bottom: 8px;

    .card-info-col {
      font-family: "PingFang SC", sans-serif;
      font-size: 12px;
      padding: 8px;
      padding-bottom: 0;

      .card-info-title {
        color: #888;
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
