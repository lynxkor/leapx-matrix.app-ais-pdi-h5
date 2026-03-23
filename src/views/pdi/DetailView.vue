<template>
  <div class="detail-view-content">
    <van-loading color="#00AA00" class="loading-area" v-if="isFetch" />
    <template v-else>
      <div class="detail-view-header">
        <ais-header-tab :tabList="tabList" :currentIndex="currentIndex" />
      </div>
      <div class="detail-view-center" v-if="type === 'detail'">
        <div class="center-info-content">
          <svg class="icon center-info-img" aria-hidden="true">
            <use xlink:href="#icon-lxp-h5circle"></use>
          </svg>
          <div class="center-info-text">
            <p>如有异常请选中车辆受损部位，并填写受损信息。</p>
            <p>无异常，请直接点击下一步。</p>
          </div>
        </div>
        <appearance
          v-if="currentIndexName === '外观检查' || currentIndexName === '玻璃检查'"
          :checkItems="pdiItem?.checkItems[currentIndex]"
          :api="addPdiEntry"
          :version="pdiItem?.version"
          :id="pdiItem?.id"
          @reload="reload"
        ></appearance>
        <inner
          v-if="currentIndexName === '车内检查'"
          :checkItems="pdiItem?.checkItems[currentIndex]"
          :needSubmit="needSubmit"
          :version="pdiItem?.version"
          :id="pdiItem?.id"
          @submitInner="submitInner"
        ></inner>
        <function
          v-if="currentIndexName === '功能检查'"
          :checkItems="pdiItem?.checkItems[currentIndex]"
          :version="pdiItem?.version"
          :id="pdiItem?.id"
          @submitFunction="submitFunction"
          :lastSubmit="lastSubmit"
        ></function>
      </div>
      <div class="detail-view-center" v-if="type !== 'detail'">
        <repair
          :checkItems="pdiItem?.checkItems[currentIndex]"
          :version="pdiItem?.version"
          :id="pdiItem?.id"
          :currentIndexName="currentIndexName"
          :repairClick="repairClick"
          @repairSubmit="repairSubmit"
        ></repair>
      </div>
      <footer class="detail-view-footer">
        <ais-button
          class="footer-btn"
          style="width: 130px"
          v-if="currentIndex != 0"
          plain
          @click="toFormer()"
          >上一步</ais-button
        >
        <ais-button
          class="footer-btn"
          style="flex: 1"
          v-if="currentIndex < pdiItem?.checkItems.length - 1"
          @click="toNext()"
          :loading="submitLoading"
          >下一步，{{ pdiItem?.checkItems[currentIndex + 1].name }}</ais-button
        >
        <ais-button
          class="footer-btn"
          style="flex: 1"
          v-if="currentIndex === pdiItem?.checkItems.length - 1"
          @click="toSubmit()"
          :loading="submitLoading"
          >完成提交</ais-button
        >
      </footer>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { useGlobalStore } from '@/stores/global'
import AisHeaderTab from '@/components/AisHeaderTab.vue'
import AisButton from '@/components/AisButton.vue'
import Appearance from '@/components/DetailCard/Appearance.vue'
import Inner from '@/components/DetailCard/Inner.vue'
import Function from '@/components/DetailCard/Function.vue'
import Repair from '@/components/DetailCard/Repair.vue'
import { getPdiDetails, getPdiRepairDetails, addPdiEntry, addRepairConfirm } from '@/api/pdi'

defineOptions({
  name: 'PdiDetailView',
})

const globalStore = useGlobalStore()
const route = useRoute()
const router = useRouter()

const tabList = ref([])
const currentIndex = ref(0)
const currentIndexName = ref('')
const type = ref('')
const pdiItem = reactive({})
const isFetch = ref(true)
let api, pdiId
const needSubmit = ref(false)
const lastSubmit = ref(false)
const repairClick = ref(false)
const submitLoading = ref(false)

onMounted(() => {
  const { query } = route
  const { id, vin, code } = query
  type.value = query.type
  const title = `
    <p style='font-weight: 500; font-size: 15px; color: #191A1B;'>${vin}</p>
    <p style='font-size: 12px; color: #888888;'>${code}</p>
  `
  globalStore.setTitle(title)
  api = query.type === 'detail' ? getPdiDetails : getPdiRepairDetails
  pdiId = id
  getDetail(api, pdiId)
})

const getDetail = (api, id) => {
  isFetch.value = true
  api(id)
    .then((res) => {
      if (res.code === 200) {
        const data = res.data
        console.log(data)
        tabList.value = data.checkItems.map((item) => item.name)
        currentIndexName.value = tabList.value[currentIndex.value]
        Object.assign(pdiItem, { ...data })
        isFetch.value = false
      } else {
        showFailToast(res.msg)
        setTimeout(() => {
          router.go(-1)
        }, 300)
      }
    })
    .catch((err) => {
      console.log(err)
    })
    .finally(() => {
      isFetch.value = false
    })
}

const reload = () => {
  getDetail(api, pdiId)
}

const submitInner = (isSubmit, data) => {
  if (isSubmit) {
    submitLoading.value = true
    addPdiEntry(data).then((res) => {
      if (res.code === 200) {
        needSubmit.value = false
        submitLoading.value = false
        getDetail(api, pdiId)
        currentIndex.value = currentIndex.value + 1
      } else {
        showFailToast(res.msg)
      }
    })
  } else {
    needSubmit.value = false
    submitLoading.value = false
  }
}

const submitFunction = (isLastSubmit, data) => {
  if (isLastSubmit) {
    console.log(data)
    submitLoading.value = true
    addPdiEntry(data).then((res) => {
      lastSubmit.value = false
      submitLoading.value = false
      if (res.code === 200) {
        setTimeout(() => {
          sessionStorage.setItem('needRefresh', true)
          router.go(-1)
        }, 300)
      } else {
        showFailToast(res.msg)
      }
    })
  } else {
    lastSubmit.value = false
    submitLoading.value = false
  }
}

const toNext = () => {
  if (type.value === 'detail') {
    // 在库、入库
    if (currentIndex.value === 2) {
      // 车内检查
      needSubmit.value = true
    } else {
      getDetail(api, pdiId)
      currentIndex.value = currentIndex.value + 1
    }
  } else {
    // 异常车辆
    // getDetail(api, pdiId)
    // currentIndex.value = currentIndex.value + 1
    repairClick.value = true
  }
}

const toFormer = () => {
  getDetail(api, pdiId)
  currentIndex.value = currentIndex.value - 1
}

const toSubmit = () => {
  console.log('提交')
  if (type.value === 'detail') {
    lastSubmit.value = true
  } else {
    repairClick.value = true
  }
}

const repairSubmit = (isSubmit, data) => {
  if (isSubmit) {
    submitLoading.value = true
    addRepairConfirm(data).then((res) => {
      repairClick.value = false
      submitLoading.value = false
      if (res.code === 200) {
        if (currentIndex.value === tabList.value.length - 1) {
          setTimeout(() => {
            sessionStorage.setItem('needRefresh', true)
            router.go(-1)
          }, 300)
        } else {
          getDetail(api, pdiId)
          currentIndex.value = currentIndex.value + 1
        }
      } else {
        showFailToast(res.msg)
      }
    })
  } else {
    repairClick.value = false
    submitLoading.value = false
  }
}

watch(
  () => currentIndex.value,
  (newVal) => {
    currentIndexName.value = tabList.value[newVal]
  },
)
</script>

<style lang="scss" scoped>
.detail-view-content {
  height: 100%;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
}
.detail-view-header {
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  padding: 0 12px;
  background: #ffffff;
}
.detail-view-center {
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
  .center-info-content {
    padding: 8px 12px;
    background: rgba(237, 139, 61, 0.1);
    display: flex;
    align-items: flex-start;
    .center-info-img {
      width: 16px;
      height: 16px;
      margin-right: 4px;
      margin-top: 2px;
    }
    .center-info-text {
      font-size: 12px;
      color: #ed8b3d;
    }
  }
}
.detail-view-footer {
  height: 54px;
  padding: 7px 3.5vw;
  box-sizing: border-box;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  .footer-btn {
    height: 40px;
    margin: 0 auto;
  }
}
.loading-area {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
