<template>
  <div class="base-container">
    <header>
      <van-nav-bar
        :title="globalStore.title"
        left-arrow
        @click-left="goBack"
      >
        <template #title>
          <div class="custom-title">
            <span v-html="globalStore.title"></span>
          </div>
        </template>
      </van-nav-bar>
    </header>
    <div class="vehstock-content">
      <RouterView/>
    </div>
  </div>
  
</template>

<script setup lang="ts">
  import { RouterView } from 'vue-router'

  import { useGlobalStore } from '@/stores/global'
  import { goBack } from '../utils/app'

  const globalStore = useGlobalStore()
  
</script>

<style lang="scss" scoped>
  .base-container {
    width: 100%;
    height: 100%;
    background: #f7f7f7;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .vehstock-content{
    flex: 1;
    overflow-y: auto;
  }
</style>
  