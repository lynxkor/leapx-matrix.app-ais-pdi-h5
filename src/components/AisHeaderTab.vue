<template>
  <div class="header-tab-line" :class="{ 'center-tabs': !shouldScroll }" ref="headerLineRef">
    <div class="header-item" v-for="(tab, index) in tabList" :key="index">
      <span :class="index <= currentIndex ? 'header-item-text header-item-text-hl' : 'header-item-text'">{{ tab }}</span>
      <img class="header-item-img" v-if="index < tabList.length - 1" :src="index <= currentIndex ? progressHlIcon : progressIcon" />
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, nextTick, onMounted, watch } from 'vue'
import progressIcon from '../assets/img/progress.png'
import progressHlIcon from '../assets/img/progress_hl.png'

const props = defineProps({
  tabList: {
    type: Array,
    default: () => {
      return []
    }
  },
  currentIndex: {
    type: Number,
    default: 0
  }
})

const headerLineRef = ref(null)
const shouldScroll = ref(false)

const checkOverflow = async() => {
  await nextTick()
  if (headerLineRef.value) {
    const containerWidth = headerLineRef.value.clientWidth
    const contentWidth = headerLineRef.value.scrollWidth
    shouldScroll.value = contentWidth > containerWidth
  }
}

onMounted(() => {
  checkOverflow()
})

watch(() => props.tabList, () => {
  checkOverflow()
}, { deep: true })

</script>

<style lang="scss" scoped>
.header-tab-line{
  width: 100%;
  display: flex;
  height: 42px;
  align-items: center;
  justify-content: flex-start;
  overflow-x: auto;
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
  &.center-tabs {
    justify-content: center;
  }
  .header-item{
    overflow-x: auto;
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    min-width: auto;
    flex-wrap: nowrap;
    .header-item-text{
      font-family: PingFang SC;
      font-size: 14px;
      color: #888888;
      margin: 0 4px;
    }

    .header-item-text-hl{
      color: #00AA00;
    }

    .header-item-img{
      width: 35px;
      height: 10px;
    }
  }
}
</style>
