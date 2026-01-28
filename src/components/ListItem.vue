<template>
  <div class="list-item-content">
    <div class="card-title-text">LFGF23435263563</div>
    <div class="card-subtitle-text">B10-650舒享版舒享版舒享版舒享版650舒享版舒享版舒享版舒享版 | 外观星夜蓝 | 内饰幻月紫</div>
    <van-row class="card-info">
      <van-col span="12" class="card-info-col">
        <p class="card-info-title">收车确认时间：</p>
        <p class="card-info-des">2025-10-24 12:19:43</p>
      </van-col>
      <van-col span="12" class="card-info-col">
        <p class="card-info-title">PDI提交截止时间：</p>
        <p class="card-info-des">2025-10-24 12:19:43</p>
      </van-col>
      <van-col span="12" class="card-info-col">
        <p class="card-info-title">销售门店：</p>
        <p class="card-info-des">杭州芯图大厦体验店大厦体验店大厦体验店杭州芯图大厦体验店大厦体验店大厦体验店</p>
      </van-col>
      <van-col span="12" class="card-info-col">
        <p class="card-info-title">交付门店：</p>
        <p class="card-info-des">杭州芯图大厦体验店大厦体验店大厦体验店</p>
      </van-col>
    </van-row>
    <div class="btn-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  dataItem: {
    type: Object,
    default: () => {
      return {}
    }
  }
})
</script>

<style lang="scss" scoped>
.list-item-content{
  background: #FFFFFF;
  padding: 12px;
  border-radius: 7px;
  margin-top: 12px;
  .card-title-text{
    font-family: PingFang SC;
    font-size: 16px;
    font-weight: 500;
    color: #191A1B;
  }
  .card-subtitle-text{
    font-family: PingFang SC;
    font-size: 13px;
    color: #545454;
  }
  .card-info{
    box-sizing: border-box;
    background: #FCFBFB;
    margin-top: 8px;
    padding-bottom: 8px;
    .card-info-col{
      font-family: PingFang SC;
      font-size: 12px;
      padding: 8px;
      padding-bottom: 0;
      .card-info-title{
        color: #888888;
        margin-bottom: 2px;
      }
      .card-info-des{
        color: #545454;
      }
    }
  }
  .btn-content{
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
