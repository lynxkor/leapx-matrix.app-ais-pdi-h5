<template>
  <div class="detail-view-content">
    <div class="detail-view-header">
      <ais-header-tab :tabList="tabList" :currentIndex="currentIndex"/>
    </div>
    <div class="detail-view-center">
      <div v-for="item in 100">123</div>
    </div>
    <footer class="detail-view-footer">footer</footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGlobalStore } from '@/stores/global'
import AisHeaderTab from '@/components/AisHeaderTab.vue'

const globalStore = useGlobalStore()
const route = useRoute()
const { query } = route
console.log(query)
const title = `
  <p style='font-weight: 500; font-size: 15px; color: #191A1B;'>LFGF23435263563</p>
  <p style='font-size: 12px; color: #888888;'>DC-251289238237</p>
`
globalStore.setTitle(title)

const tabList = ['外观检查', '玻璃检查', '车内检查', '功能检查']
const currentIndex = ref(1)
</script>

<style lang="scss" scoped>
.detail-view-content{
  height: 100%;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
}
.detail-view-header{
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  padding: 0 12px;
  background: #ffffff;
}
.detail-view-center{
  flex: 1;
  height: 0;
  background: pink;
}
.detail-view-footer{
  height: 54px;
  background: cyan;
}
</style>
