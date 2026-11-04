<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import ExampleActionSheet from './components/ActionSheet.vue'

const show = ref(false)

const route = useRoute()
const id = route.query.id

console.log(id)
</script>

<template>
  <div class="m-example-detail">
    <van-swipe class="m-swipe" :autoplay="3000" indicator-color="white">
      <van-swipe-item>1</van-swipe-item>
      <van-swipe-item>2</van-swipe-item>
      <van-swipe-item>3</van-swipe-item>
      <van-swipe-item>4</van-swipe-item>
    </van-swipe>
    <van-action-bar>
      <van-action-bar-button color="#999" type="warning" text="取消" />
      <van-action-bar-button type="danger" text="立即下单" @click="show = true"/>
    </van-action-bar>

    <example-action-sheet
      v-model:show="show"
      title="标题"
      @cancel="show = false"
    />
  </div>
</template>

<style lang="scss">
.m-example-detail {
  .m-swipe .van-swipe-item {
    color: #fff;
    font-size: 20px;
    line-height: 150px;
    text-align: center;
    background-color: #39a9ed;
  }

  .m-content {
    position: relative;
    height: 70vh;

    .g-btns {
      position: absolute;
      width: 100%;
      bottom: 0;
      padding: 20px 0;
      background-color: #f9f9f9;
      text-align: center;
    }

    .van-button + .van-button {
      margin-left: 50px;
    }
  }

}
</style>
