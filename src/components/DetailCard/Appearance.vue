<template>
  <div class="appearance-content">
    <div class="car-content">
      <div class="car-content-inner">
        <img :src="checkItems.atlasUrl" class="car-bg-img"/>
          <div v-for="(inspectItem, inspectIndex) in checkItems.checkItems" :key="inspectIndex"
            :class="inspectItem.isUnusual ? 'inspect-item-content inspect-item-content-error' : 'inspect-item-content'"
            :style="{top: `${inspectItem.atlasCoordTop}px`, left: `${inspectItem.atlasCoordLeft}px`, right: `${inspectItem.atlasCoordRight}px`}"
            @click="showPop(inspectItem)"
          >
            {{ inspectItem.name }}
          </div>
      </div>
    </div>
  </div>
  <van-popup v-model:show="show" round position="bottom"
    closeable close-icon="close" close-icon-position="top-left"
    :close-on-click-overlay="false"
    :before-close="beforeClose"
    :style="{ height: '88%', backgroundColor: '#F4F4F4' }">
    <div class="popup-inner">
      <p class="popup-title">{{ title }}</p>
      <div class="state-content">
          <div class="switch-content">
            <van-row>
              <van-col class="check-item" v-for="(item, index) in popupObj.damagedTypeList" :key="index" span="12">
                <span class="check-item-text">{{ item.damagedType }}</span>
                <div class="switch-inner">
                  <span v-if="item.isUnusual">异常</span>
                  <van-switch v-model="item.isUnusual" size="20px" inactive-color="#00AA00" active-color="#E43122" @change="switchChange()"/>
                </div>
              </van-col>
            </van-row>
          </div>
          <div class="file-content">
            <p class="file-title">异常说明<span class="require-text">*</span></p>
            <van-field
              class="textarea-content"
              v-model="popupObj.abnormalDesc"
              :disabled="popupInputDisabled"
              rows="1"
              autosize
              type="textarea"
              placeholder="请输入异常说明，不少于10个字"
            />
            <p class="file-title">上传图片<span class="grey-text">(需提供近景图及远景图)</span><span class="require-text">*</span></p>
            <div class="upload-content">
              <div class="upload-item" v-if="popupObj.abnormalUrlList[0]">
                <img style="width: 100%; height: 100%; margin-bottom: 0" :src="popupObj.abnormalUrlList[0]" @click="showImg(popupObj.abnormalUrlList[0])"/>
                <img class="delete_icon" src="../../assets/img/delete_icon.png" @click="deleteImg(0)"/>
              </div>
              <div class="upload-item" v-if="!popupObj.abnormalUrlList[0]" @click="uploadClick(0)">
                <svg class="icon upload-img" aria-hidden="true">
                  <use xlink:href="#icon-lxp-h5upload-mob"></use>
                </svg>
                <span class="upload-text">近景图</span>
              </div>
              <div class="upload-item" v-if="popupObj.abnormalUrlList[1]">
                <img style="width: 100%; height: 100%; margin-bottom: 0" :src="popupObj.abnormalUrlList[1]" @click="showImg(popupObj.abnormalUrlList[1])"/>
                <img class="delete_icon" src="../../assets/img/delete_icon.png" @click="deleteImg(1)"/>
              </div>
              <div class="upload-item" v-if="!popupObj.abnormalUrlList[1]" @click="uploadClick(1)">
                <svg class="icon upload-img" aria-hidden="true">
                  <use xlink:href="#icon-lxp-h5upload-mob"></use>
                </svg>
                <span class="upload-text">远景图</span>
              </div>
            </div>
          </div>
      </div>
      <div class="popup-footer">
        <ais-button style="height: 40px;" :disabled="popupInputDisabled" @click="saveClick">保存并返回</ais-button>
      </div>
    </div>
  </van-popup>
  <ais-dialog :showDialog="showDialog" :dialogObj="dialogObj">
    <p class="dialog-line-text">返回后编辑的数据将会被清空，确定要执行此操作吗？</p>
  </ais-dialog>
</template>

<script setup>
import { reactive, ref, defineProps, onMounted, defineEmits } from 'vue'
import { showFailToast, showImagePreview } from 'vant'
import { getAppImg } from '@/libs/utils/nativeFn'
import AisButton from '../AisButton.vue'
import AisDialog from '@/libs/components/AisDialog.vue'

const props = defineProps({
  checkItems: {
    type: Object,
    default: () => {
      return {}
    }
  },
  api: {
    type: Object
  },
  version: {
    type: String || Number,
    default: ''
  },
  id: {
    type: String || Number,
    default: ''
  }
})

const emit = defineEmits(['reload'])

const show = ref(false)
const title = ref('检查-车顶')
const popupObj = reactive({})
const tempObj = reactive({})
const popupInputDisabled = ref(true)
const showDialog = ref(false)
const imgIndex = ref('')
const dialogObj = {
  index: '',
  title: '提醒',
  submitText: '确定',
  cancelText: '取消',
  submitFn: () => { showDialog.value = false; show.value = false },
  cancelFn: () => { showDialog.value = false }
}

onMounted(() => {
  window.getImage = (url) => {
    // 图片上传之后图片覆盖
    popupObj.abnormalUrlList[imgIndex.value] = url
  }
})

const showPop = (item) => {
  title.value = `检查-${item.name}`
  Object.assign(popupObj, JSON.parse(JSON.stringify({
    ...item,
    abnormalUrlList: item.abnormalUrl && item.abnormalUrl.length ? item.abnormalUrl.split(',') : [],
    abnormalDesc: item.abnormalDesc ? item.abnormalDesc : ''
  })))
  Object.assign(tempObj, JSON.parse(JSON.stringify({
    ...item,
    abnormalDesc: item.abnormalDesc ? item.abnormalDesc : ''
  })))
  popupInputDisabled.value = true
  popupObj.damagedTypeList.map(damagedType => {
    damagedType.isUnusual = Boolean(damagedType.isUnusual)
  })
  show.value = true
}

const showImg = url => {
  showImagePreview([url])
}

const deleteImg = (index) => {
  if (popupInputDisabled.value) {
    return false
  }
  popupObj.abnormalUrlList.splice(index, 1, '')
}

const uploadClick = (_index) => {
  if (popupInputDisabled.value) {
    return false
  }
  // 近、远图
  imgIndex.value = _index
  getAppImg()
}

const beforeClose = () => {
  // 需要判断数据有没有操作过
  if (popupInputDisabled.value) {
    show.value = false
  } else {
    showDialog.value = true
  }
}

const saveClick = () => {
  // 调用提交接口，然后再调用详情接口页面重新刷新
  const deepClone = (obj) => JSON.parse(JSON.stringify(obj))
  const _checkItems = { ...deepClone(popupObj) }
  let _count = 0
  _checkItems.abnormalUrl = _checkItems.abnormalUrlList.join(',')
  _checkItems.damagedTypeList.map(damagedType => {
    damagedType.isUnusual = Number(damagedType.isUnusual)
    if (damagedType.isUnusual) {
      _count++
    }
  })
  console.log(_count)
  // return
  if (_count === 0) {
    // 没有勾选异常
    _checkItems.isUnusual = 0
  } else {
    // 输入框和图片要必填
    if (!popupObj.abnormalDesc) {
      showFailToast('请输入异常说明')
      return
    }
    if (popupObj.abnormalDesc.length < 10) {
      showFailToast('异常说明不少于10个字')
      return
    }
    if (!popupObj.abnormalUrlList.length) {
      showFailToast('请上传图片')
      return
    }
    if (!popupObj.abnormalUrlList[0]) {
      showFailToast('请上传近景图')
      return
    }
    if (!popupObj.abnormalUrlList[1]) {
      showFailToast('请上传远景图')
      return
    }
    _checkItems.isUnusual = 1
  }
  const params = {
    isPdiSubmit: 0,
    id: props.id,
    version: props.version,
    checkItems: [_checkItems]
  }
  props.api(params).then(res => {
    show.value = false
    emit('reload')
  })
}

const switchChange = () => {
  // 需要所有的复选框状态都要判断
  for (let index = 0; index < tempObj.damagedTypeList.length; index++) {
    if (Number(popupObj.damagedTypeList[index].isUnusual) === tempObj.damagedTypeList[index].isUnusual) {
      popupInputDisabled.value = true
    } else {
      popupInputDisabled.value = false
      break
    }
  }
}

</script>

<style lang="scss" scoped>
.appearance-content{
  flex: 1;
  overflow-y: auto;
}

.car-content{
  width: 100%;
  border-top: 1px dashed #6C6E6C;
  border-bottom: 1px dashed #6C6E6C;
  .car-content-inner{
    width: 375px;
    max-width: 100%;
    height: 546px;
    margin: 0 auto;
    position: relative;
    .car-bg-img{
      width: 100%;
    }
    .inspect-item-content{
      box-sizing: border-box;
      border: 1px solid #191A1B;
      padding: 2px 4px;
      display: inline-block;
      position: absolute;
      font-family: PingFang SC;
      font-size: 12px;
      color: #191A1B;
      white-space: nowrap;
    }
    .inspect-item-content-error{
      border: 0.5px solid #B91919;
      background: #B91919;
      color: #FFFFFF;
    }
  }
}

.popup-inner{
  width: 93%;
  height: 100%;
  margin: 0 auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  .popup-title{
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    color: #191A1B;
    padding: 12px 0;
  }
  .state-content{
    border-radius: 7px;
    margin-bottom: 12px;
    overflow-y: auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    .switch-content{
      border-radius: 6px;
      background: #FFFFFF;
      margin-bottom: 8px;
      width: 100%;
      padding: 12px;
      box-sizing: border-box;
    }
    .file-content{
      border-radius: 6px;
      background: #FFFFFF;
      margin-bottom: 8px;
      width: 100%;
      padding: 12px;
      box-sizing: border-box;
      padding-bottom: 20px;
    }
  }
}

.check-item{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #E6E6E5;
  border-right: 1px solid #E6E6E5;
  &:nth-last-of-type(1) {
    border-bottom: 0;
  }
  &:nth-of-type(even) {
    border-right: 0;
  }
  .check-item-text{
    font-family: PingFang SC;
    font-size: 14px;
    color: #191A1B;
    padding-left: 8px;
  }
}

.switch-inner{
  display: flex;
  align-items: center;
  justify-content: space-between;
  span{
    font-family: PingFang SC;
    font-size: 12px;
    color: #E43122;
    margin-right: 4px;
  }
}

.file-content{
  .file-title{
    font-size: 14px;
    letter-spacing: 0.7px;
    color: #191A1B;
    margin-bottom: 8px;
    .require-text{
      color: #E43122;
    }
    .grey-text{
      color: #888888;
    }
  }
  .textarea-content{
    width: 100%;
    height: 80px;
    box-sizing: border-box;
    padding: 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 7px;
    margin-bottom: 16px;
  }
  .upload-content{
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    .upload-item{
      width: 80px;
      height: 80px;
      border-radius: 7px;
      background: #F5F5F5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      .upload-img{
        width: 24px;
        height: 24px;
        margin-bottom: 12px;
      }
      .upload-text{
        font-size: 12px;
        color: #888888;
      }
      .delete_icon{
        position: absolute;
        top: 0;
        right: 0;
        width: 15px;
        height: 15px;
      }
    }
  }
}

.popup-footer{
  height: 40px;
  margin-bottom: 20px;
}

.dialog-line-text{
  font-size: 14px;
  letter-spacing: 0.43px;
  color: #545454;
}
</style>
