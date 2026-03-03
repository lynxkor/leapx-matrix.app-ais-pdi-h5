<template>
  <div class="repair-content">
    <van-collapse v-model="activeNames">
      <van-collapse-item v-for="(checkItem, checkItemIndex) in innerObj.checkItems" :key="checkItemIndex" :title="checkItem.name" :name="checkItemIndex" class="collapse-content">
        <div class="switch-content">
          <van-row>
            <div class="file-content">
              <div class="error-text-content">
                <div class="error-text-item" v-for="(errorItem, errorIndex) in setTypeList(checkItem)" :key="errorIndex">{{ errorItem }}</div>
              </div>
              <div class="reason-text">异常说明：{{ checkItem.abnormalDesc }}</div>
              <div class="img-content">
                <img class="reason-img" v-for="(imgItem, imgIndex) in checkItem.abnormalUrl.length && checkItem.abnormalUrl?.split(',')" :key="imgIndex" :src="imgItem" @click="showImg(imgItem)"/>
              </div>
            </div>
          </van-row>
        </div>
      </van-collapse-item>
    </van-collapse>
    <div class="repair-state-content">
      <div class="repair-state-title">修复情况</div>
      <div class="fill-content">
        <div class="switch-content">
          <span class="switch-text">{{ innerObj.name }}异常是否修复</span>
          <div class="switch-ope">
            <span :style="{color: isRepairedFlag ? '#00AA00' : '#E43122'}">{{ isRepairedFlag ? '已修复' : '未修复' }}</span>
            <van-switch v-model="isRepairedFlag" size="20px" active-color="#00AA00" inactive-color="#E43122"/>
          </div>
        </div>
        <van-field
          class="textarea-content"
          v-model="repairedDesc"
          rows="1"
          autosize
          type="textarea"
          placeholder="请输入修复说明，不少于10个字"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, watch, reactive, defineEmits } from 'vue'
import { showFailToast, showImagePreview } from 'vant'

const props = defineProps({
  checkItems: {
    type: Object,
    default: () => {
      return {}
    }
  },
  version: {
    type: String || Number,
    default: ''
  },
  id: {
    type: String || Number,
    default: ''
  },
  repairClick: {
    type: Boolean,
    default: false
  },
  currentIndexName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['repairSubmit'])

const activeNames = ref([0])
const innerObj = reactive({})
const deepClone = (obj) => JSON.parse(JSON.stringify(obj))
const isRepairedFlag = ref(false)
const repairedDesc = ref('')

const showImg = url => {
  showImagePreview([url])
}

const setTypeList = (checkItem) => {
  const _currentIndexName = props.currentIndexName
  if (_currentIndexName !== '车内检查') {
    const arr = []
    checkItem.damagedTypeList.filter(item => {
      if (item.isUnusual) {
        arr.push(item.damagedType)
      }
    })
    return arr
  } else {
    const arr = []
    checkItem.checkItems.filter(item => {
      if (item.isUnusual) {
        arr.push(item.name)
      }
    })
    return arr
  }
}

watch(
  () => props.checkItems,
  newVal => {
    console.log('checkitem')
    console.log(newVal)
    Object.assign(innerObj, {
      ...deepClone(newVal)
    })
    isRepairedFlag.value = Boolean(innerObj.checkItems[0].isRepaired)
    repairedDesc.value = innerObj.checkItems[0].repairedDesc
  },
  {
    immediate: true
  }
)

watch(
  () => props.repairClick,
  newVal => {
    if (newVal) {
      const _data = {
        ...deepClone(innerObj),
        isRepaired: Number(isRepairedFlag.value)
      }

      console.log(_data)
      if (_data.isRepaired) {
        console.log('已经修复')
        // 已经修复
        if (!repairedDesc.value) {
          showFailToast('请输入修复说明')
          emit('repairSubmit', false, {})
          return
        }
        if (repairedDesc.value.length < 10) {
          showFailToast('修复说明不得少于10个字')
          emit('repairSubmit', false, {})
          return
        }
        const _currentIndexName = props.currentIndexName
        console.log('_currentIndexName', _currentIndexName)
        if (_currentIndexName !== '车内检查') {
          _data.checkItems.map(checkItem => {
            checkItem.isRepaired = 1
            checkItem.repairedDesc = repairedDesc.value
          })
        } else {
          // 所有的都需要repairedDesc字段
          console.log(_data.checkItems)
          _data.checkItems.map(checkItem => {
            checkItem.isRepaired = 1
            console.log(checkItem)
            checkItem.repairedDesc = repairedDesc.value
            checkItem.checkItems.map(item => {
              item.isRepaired = 1
            })
          })
        }
      }
      _data.version = props.version
      const _params = {
        id: props.id,
        version: props.version,
        checkItems: _data.checkItems
      }
      console.log(_data)
      console.log(_params)
      emit('repairSubmit', true, _params)
    }
  }
)

</script>

<style lang="scss" scoped>
.repair-content{
  flex: 1;
  overflow-y: auto;
}

.collapse-content{
  margin: 12px;
  border-radius: 6px;
  overflow: hidden;

  .file-content{
    width: 100%;
    .error-text-content{
      display: flex;
      gap: 4px;
      align-items: center;
      flex-wrap: wrap;
      .error-text-item{
        padding: 0 4px;
        font-family: PingFang SC;
        font-size: 12px;
        color: #B91919;
        border: 1px solid #B91919;
        white-space: nowrap;
      }
    }
    .reason-text{
      font-family: PingFang SC;
      font-size: 14px;
      letter-spacing: 0.7px;
      color: #191A1B;
      margin-top: 8px;
    }
    .img-content{
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      .reason-img{
        width: 80px;
        height: 80px;
        border-radius: 7px;
      }
    }
  }
}

.repair-state-content{
  margin: 8px 12px;
  border-radius: 6px;
  background: #FFFFFF;
  .repair-state-title{
    font-family: PingFang SC;
    font-size: 14px;
    font-weight: 500;
    color: #191A1B;
    padding: 12px 8px;
  }
  .fill-content{
    border-top: 1px solid #E6E6E5;
    padding: 12px;
    padding-bottom: 20px;
    .switch-content{
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      .switch-text{
        font-family: PingFang SC;
        font-size: 14px;
        letter-spacing: 0.7px;
        color: #191A1B;
        flex: 1;
      }
      .switch-ope{
        margin-left: 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: nowrap;
        span{
          margin-right: 4px;
          font-family: PingFang SC;
          font-size: 12px;
        }
      }
    }
  }
  .textarea-content{
    width: 100%;
    height: 80px;
    box-sizing: border-box;
    padding: 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 7px;
    margin-top: 6px;
  }
}
</style>
