<template>
  <div class="inner-content">
    <van-collapse v-model="activeNames">
      <van-collapse-item v-for="(checkItemItem, checkItemIndex) in innerObj.checkItems" :key="checkItemIndex" :title="checkItemItem.name" :name="index" :value="checkItemItem.isUnusual ? '异常' : ''" value-class="error-text" class="collapse-content">
        <div class="switch-content">
          <van-row>
            <van-col class="check-item" v-for="(inspectItem, inspectIndex) in checkItemItem.checkItems" :key="inspectIndex" span="24">
              <span class="check-item-text">{{ inspectItem.name }}</span>
              <div class="switch-inner">
                <span v-if="inspectItem.isUnusual">异常</span>
                <van-switch v-model="inspectItem.isUnusual" size="20px" inactive-color="#00AA00" active-color="#E43122" @change="switchChange(checkItemItem, checkItemIndex)"/>
              </div>
            </van-col>
            <div class="file-content">
              <p class="file-title">异常说明<span class="require-text">*</span></p>
              <van-field
                class="textarea-content"
                v-model="checkItemItem.abnormalDesc"
                :disabled="checkItemItem.isInputDisabled"
                rows="1"
                autosize
                type="textarea"
                placeholder="请输入异常说明，不少于10个字"
              />
              <p class="file-title">上传图片<span class="grey-text"></span><span class="require-text">*</span></p>
              <div class="upload-content">
                <div class="upload-item" v-for="(img, imgIndex) in checkItemItem.abnormalUrlList" :key="imgIndex">
                  <img style="width: 100%; height: 100%; margin-bottom: 0" :src="img" @click="showImg(img)"/>
                  <img class="delete_icon" src="../../assets/img/delete_icon.png" @click="deleteImg(checkItemIndex, imgIndex)"/>
                </div>
                <div class="upload-item" @click="uploadClick(checkItemIndex)">
                  <svg class="icon upload-img" aria-hidden="true">
                    <use xlink:href="#icon-lxp-h5upload-mob"></use>
                  </svg>
                  <span class="upload-text">上传图片</span>
                </div>
              </div>
            </div>
          </van-row>
        </div>
      </van-collapse-item>
    </van-collapse>
  </div>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits, watch, onMounted } from 'vue'
import { showFailToast, showImagePreview } from 'vant'
import { getAppImg } from '@/libs/utils/nativeFn'

const props = defineProps({
  checkItems: {
    type: Object,
    default: () => {
      return {}
    }
  },
  needSubmit: {
    type: Boolean,
    default: false
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

const emit = defineEmits(['submitInner'])
const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

onMounted(() => {
  window.getImage = (url) => {
    innerObj.checkItems[clickIndex.value].abnormalUrlList.push(url)
  }
})

const innerObj = reactive({})
const tempObj = reactive({})

const activeNames = ref(['1'])
const clickIndex = ref()

const switchChange = (_secondCheckItemItem, _firstIndex) => {
  const _obj = innerObj.checkItems[_firstIndex].checkItems
  const _temp = tempObj.checkItems[_firstIndex].checkItems
  for (let index = 0; index < _obj.length; index++) {
    if (Number(_obj[index].isUnusual) === _temp[index].isUnusual) {
      _secondCheckItemItem.isInputDisabled = true
    } else {
      _secondCheckItemItem.isInputDisabled = false
      break
    }
  }
}

const showImg = url => {
  showImagePreview([url])
}

const deleteImg = (_firstIndex, index) => {
  // if (innerObj.checkItems[_firstIndex].isInputDisabled) {
  //   return false
  // }
  innerObj.checkItems[_firstIndex].abnormalUrlList.splice(index, 1)
}

const uploadClick = (_firstIndex) => {
  // if (innerObj.checkItems[_firstIndex].isInputDisabled) {
  //   return false
  // }
  clickIndex.value = _firstIndex
  getAppImg()
}

watch(
  () => props.checkItems,
  (newVal) => {
    // 使用深拷贝避免对象引用问题
    Object.assign(innerObj, {
      ...deepClone(newVal)
    })
    Object.assign(tempObj, deepClone(newVal))
    innerObj.checkItems.map(checkItem => {
      checkItem.isInputDisabled = true
      checkItem.abnormalUrlList = checkItem.abnormalUrl && checkItem.abnormalUrl.length ? checkItem.abnormalUrl.split(',') : []
      checkItem.checkItems.map(thirdItem => {
        thirdItem.isUnusual = Boolean(thirdItem.isUnusual)
        if (thirdItem.isUnusual) {
          checkItem.isUnusual = 1
        }
      })
    })
  },
  {
    immediate: true
  }
)

watch(
  () => props.needSubmit,
  newVal => {
    if (newVal) {
      const obj = { ...deepClone(innerObj) }
      let isSubmit = true
      // 备注和图片必填
      for (const checkItem of obj.checkItems) {
        let count = 0
        checkItem.checkItems.map(thirdItem => {
          if (thirdItem.isUnusual) {
            count++
          }
        })
        if (count > 0) {
          // 二级的异常置为true
          checkItem.isUnusual = 1
          if (!checkItem.abnormalDesc) {
            showFailToast(`请输入${checkItem.name}异常说明`)
            isSubmit = false
            break
          }
          if (!checkItem.abnormalUrlList.length) {
            showFailToast(`请上传${checkItem.name}异常图片`)
            isSubmit = false
            break
          }
        } else {
          checkItem.isUnusual = 0
        }
      }
      if (isSubmit) {
        obj.checkItems.map(checkItem => {
          checkItem.abnormalUrl = checkItem.abnormalUrlList.join(',')
          checkItem.checkItems.map(thirdItem => {
            thirdItem.isUnusual = Number(thirdItem.isUnusual)
          })
        })
        const _data = {
          isPdiSubmit: 0,
          id: props.id,
          version: props.version,
          checkItems: [obj]
        }
        emit('submitInner', isSubmit, _data)
      } else {
        emit('submitInner', isSubmit, {})
      }
    }
  }
)

</script>

<style lang="scss" scoped>
.inner-content{
  flex: 1;
  overflow-y: auto;
}

</style>

<style style="scss" scoped>
.collapse-content{
  margin: 12px;
  border-radius: 6px;
  overflow: hidden;
  .check-item{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    .check-item-text{
      font-family: PingFang SC;
      font-size: 14px;
      color: #191A1B;
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
    border-top: 1px solid #E6E6E5;
    width: 100%;
    padding-top: 12px;
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
      flex-wrap: wrap;
      gap: 2.13vw;
      .upload-item{
        width: 21.3vw;
        height: 21.3vw;
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
}
</style>
<style>
.inner-content .error-text{
  font-size: 12px;
  color: #E43122;
  margin-right: 12px;
}

.switch-content .van-col{
  padding-left: 0 !important;
}
</style>
