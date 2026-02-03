<template>
  <div class="detail-view-content">
    <div class="detail-view-header">
      <ais-header-tab :tabList="tabList" :currentIndex="currentIndex"/>
    </div>
    <div class="detail-view-center">
      <!-- <div class="center-info-content">
        <svg class="icon center-info-img" aria-hidden="true">
          <use xlink:href="#icon-lxp-h5circle"></use>
        </svg>
        <div class="center-info-text">
          <p>如有异常请选中车辆受损部位，并填写受损信息。</p>
          <p>无异常，请直接点击下一步。</p>
        </div>
      </div> -->
      <appearance v-if="currentIndex === 0"></appearance>
      <glass v-if="currentIndex === 1"></glass>
      <inner v-if="currentIndex === 2"></inner>
      <function v-if="currentIndex === 3"></function>
      <repair v-if="currentIndex === 4"></repair>
    </div>
    <footer class="detail-view-footer">
      <template v-if="currentIndex === 0">
        <ais-button class="footer-btn" style="flex: 1;" @click="toNext()">下一步，玻璃检查</ais-button>
      </template>
      <template v-if="currentIndex === 1">
        <ais-button class="footer-btn" style="width: 130px;" plain @click="toFormer()">上一步</ais-button>
        <ais-button class="footer-btn" style="flex: 1;" @click="toNext()">下一步，车内检查</ais-button>
      </template>
      <template v-if="currentIndex === 2">
        <ais-button class="footer-btn" style="width: 130px;" plain @click="toFormer()">上一步</ais-button>
        <ais-button class="footer-btn" style="flex: 1;" @click="toNext()">下一步，功能检查</ais-button>
      </template>
      <template v-if="currentIndex === 3">
        <ais-button class="footer-btn" style="width: 130px;" plain @click="toFormer()">上一步</ais-button>
        <ais-button class="footer-btn" style="flex: 1;" @click="toSubmit()">完成提交</ais-button>
      </template>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGlobalStore } from '@/stores/global'
import AisHeaderTab from '@/components/AisHeaderTab.vue'
import AisButton from '@/components/AisButton.vue'
import Appearance from '@/components/DetailCard/Appearance.vue'
import Glass from '@/components/DetailCard/Glass.vue'
import Inner from '@/components/DetailCard/Inner.vue'
import Function from '@/components/DetailCard/Function.vue'
import Repair from '@/components/DetailCard/Repair.vue'

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
const currentIndex = ref(4)

const toNext = () => {
  currentIndex.value = currentIndex.value + 1
}

const toFormer = () => {
  currentIndex.value = currentIndex.value - 1
}

const toSubmit = () => {
  console.log('提交')
}

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
  display: flex;
  flex-direction: column;
  .center-info-content{
    padding: 8px 12px;
    background: rgba(237, 139, 61, 0.1);
    display: flex;
    align-items: flex-start;
    .center-info-img{
      width: 16px;
      height: 16px;
      margin-right: 4px;
      margin-top: 2px;
    }
    .center-info-text{
      font-size: 12px;
      color: #ED8B3D;
    }
  }
}
.detail-view-footer{
  height: 54px;
  padding: 7px 3.5vw;
  box-sizing: border-box;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  .footer-btn{
    height: 40px;
    margin: 0 auto;
  }
}
</style>
