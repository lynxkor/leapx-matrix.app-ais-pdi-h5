<template>
  <div class="appearance-content">
    <div class="car-content">
      <div class="car-content-inner">
        <img src="../../assets/img/appearance_bg.png" class="car-bg-img"/>
          <div v-for="(inspectItem, inspectIndex) in inspectList" :key="inspectIndex"
            :class="inspectItem.isAbnormal ? 'inspect-item-content inspect-item-content-error' : 'inspect-item-content'"
            :style="{top: `${inspectItem.top}px`, left: `${inspectItem.left}px`, right: `${inspectItem.right}px`}"
            @click="showPop"
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
              <van-col class="check-item" v-for="(item, index) in switchList" :key="index" span="12">
                <span class="check-item-text">{{ item.name }}</span>
                <div class="switch-inner">
                  <span v-if="switchObj[item.key]">异常</span>
                  <van-switch v-model="switchObj[item.key]" size="20px" inactive-color="#00AA00" active-color="#E43122"/>
                </div>
              </van-col>
            </van-row>
          </div>
          <div class="file-content">
            <p class="file-title">异常说明<span class="require-text">*</span></p>
            <van-field
              class="textarea-content"
              v-model="switchObj.remark"
              rows="1"
              autosize
              type="textarea"
              placeholder="请输入异常说明，不少于10个字"
            />
            <p class="file-title">上传图片<span class="grey-text">(需提供近景图及远景图)</span><span class="require-text">*</span></p>
            <div class="upload-content">
              <div class="upload-item">
                <svg class="icon upload-img" aria-hidden="true">
                  <use xlink:href="#icon-lxp-h5upload-mob"></use>
                </svg>
                <span class="upload-text">近景图</span>
              </div>
              <div class="upload-item">
                <svg class="icon upload-img" aria-hidden="true">
                  <use xlink:href="#icon-lxp-h5upload-mob"></use>
                </svg>
                <span class="upload-text">远景图</span>
              </div>
            </div>
          </div>
      </div>
      <div class="popup-footer">
        <ais-button style="height: 40px;" :disabled="submitDisabled" @click="saveClick">保存并返回</ais-button>
      </div>
    </div>
  </van-popup>
  <ais-dialog :showDialog="showDialog" :dialogObj="dialogObj">
    <p class="dialog-line-text">返回后编辑的数据将会被清空，确定要执行此操作吗？</p>
  </ais-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import AisButton from '../AisButton.vue'
import AisDialog from '@/libs/components/AisDialog.vue'

// 需要监听传入进的对象有没有变化，有变化的话，下方按钮高亮，左上角关闭按钮增加弹窗提示

const inspectList = [
  { name: '前保险杠', top: '19', left: '15', isAbnormal: false },
  { name: '左前翼子板', top: '96', left: '15', isAbnormal: true },
  { name: '左前轮', top: '140', left: '15', isAbnormal: false },
  { name: '左后视镜', top: '205', left: '15', isAbnormal: false },
  { name: '左前门', top: '249', left: '15', isAbnormal: false },
  { name: '左后门', top: '330', left: '15', isAbnormal: false },
  { name: '左后轮', top: '383', left: '15', isAbnormal: false },
  { name: '后保险杠', top: '513', left: '15', isAbnormal: false },
  { name: '车辆底盘', top: '513', left: '160', isAbnormal: false },
  { name: '后备箱盖', top: '513', right: '15', isAbnormal: false },
  { name: '右后轮', top: '383', right: '15', isAbnormal: false },
  { name: '右后门', top: '330', right: '15', isAbnormal: false },
  { name: '右前门', top: '249', right: '15', isAbnormal: false },
  { name: '右后视镜', top: '205', right: '15', isAbnormal: false },
  { name: '右前轮', top: '140', right: '15', isAbnormal: false },
  { name: '右前翼子板', top: '96', right: '15', isAbnormal: false },
  { name: '车顶', top: '19', right: '15', isAbnormal: false },
  { name: '引擎盖', top: '19', left: '166', isAbnormal: false }
]

const show = ref(false)
const title = ref('检查-车顶')
const switchObj = reactive({
  sags: false,
  broken: true,
  replace: false,
  gap: false,
  compensation: false,
  repair: false,
  scratch: false,
  remark: ''
})
const switchList = ref([
  { name: '凹凸不平', key: 'sags' },
  { name: '损坏', key: 'broken' },
  { name: '更换', key: 'replace' },
  { name: '间隙不均', key: 'gap' },
  { name: '索赔', key: 'compensation' },
  { name: '修理', key: 'repair' },
  { name: '划痕', key: 'scratch' }
])
const showDialog = ref(false)
const dialogObj = {
  index: '',
  title: '提醒',
  submitText: '确定',
  cancelText: '取消',
  submitFn: () => { showDialog.value = false; show.value = false },
  cancelFn: () => { showDialog.value = false }
}
const submitDisabled = ref(true)

const showPop = () => {
  show.value = true
}

const beforeClose = () => {
  // 需要判断数据有没有操作过
  if (submitDisabled.value) {
    show.value = false
  } else {
    showDialog.value = true
  }
}

const saveClick = () => {
  show.value = false
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
      .upload-img{
        width: 24px;
        height: 24px;
        margin-bottom: 12px;
      }
      .upload-text{
        font-size: 12px;
        color: #888888;
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
