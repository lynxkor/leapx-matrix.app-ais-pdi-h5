<template>
  <div class="inner-content">
    <van-collapse v-model="activeNames">
      <van-collapse-item v-for="(checkItem, checkItemIndex) in checkItems.checkItems" :key="checkItemIndex" :name="checkItemIndex" class="collapse-content">
        <template #title>
          <div class="title-slot">
            <div class="title-slot-text">{{ checkItem.name }}</div>
            <div class="switch-inner" @click.stop>
              <span v-if="checkItem.isUnusual">异常</span>
              <van-switch v-model="checkItem.isUnusual" size="20px" inactive-color="#00AA00" active-color="#E43122"/>
            </div>
          </div>
        </template>
        <div class="switch-content">
          <div class="file-content">
            <p class="file-title">异常说明<span class="require-text">*</span></p>
            <van-field
              class="textarea-content"
              v-model="checkItem.abnormalDesc"
              rows="1"
              autosize
              type="textarea"
              placeholder="请输入异常说明，不少于10个字"
            />
            <p class="file-title">上传图片<span class="grey-text"></span><span class="require-text">*</span></p>
            <div class="upload-content">
              <div class="upload-item" v-for="(img, imgIndex) in innerObj.abnormalUrlList" :key="imgIndex">
                <img style="width: 100%; height: 100%; margin-bottom: 0" :src="img" @click="showImg(img)"/>
                <img class="delete_icon" src="../../assets/img/delete_icon.png" @click="deleteImg(imgIndex)"/>
              </div>
              <div class="upload-item" @click="uploadClick()">
                <svg class="icon upload-img" aria-hidden="true">
                  <use xlink:href="#icon-lxp-h5upload-mob"></use>
                </svg>
                <span class="upload-text">上传图片</span>
              </div>
            </div>
          </div>
        </div>
      </van-collapse-item>
    </van-collapse>
  </div>
</template>

<script setup>
import { ref, reactive, defineProps, watch, onMounted } from 'vue'
import { showImagePreview } from 'vant'
import { getAppImg } from '@/libs/utils/nativeFn'

const props = defineProps({
  checkItems: {
    type: Object,
    default: () => {
      return {}
    }
  }
})

onMounted(() => {
  window.getImage = (url) => {
    console.log('图片', url)
    innerObj.abnormalUrlList.push(url)
  }
})

console.log(props.checkItems)

const activeNames = ref(['1'])
const innerObj = reactive({})

const showImg = url => {
  showImagePreview([url])
}

const deleteImg = index => {
  innerObj.abnormalUrlList.splice(index, 1)
}

const uploadClick = () => {
  getAppImg()
}

watch(
  () => props.checkItems,
  newVal => {
    const deepClone = (obj) => JSON.parse(JSON.stringify(obj))
    Object.assign(innerObj, {
      ...deepClone(newVal),
      abnormalUrlList: newVal.abnormalUrl && newVal.abnormalUrl.length ? newVal.abnormalUrl.split(',') : []
    })
  },
  {
    immediate: true
  }
)

</script>

<style lang="scss" scoped>
.inner-content{
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
</style>

<style style="scss" scoped>
.collapse-content{
  margin-bottom: 12px;
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
    width: 100%;
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
.title-slot{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-right: 20px;
  .title-slot-text{
    font-family: PingFang SC;
    font-size: 14px;
    font-weight: 500;
    color: #191A1B;
  }
}
</style>
