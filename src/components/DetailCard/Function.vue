<template>
  <div class="inner-content">
    <van-collapse v-model="activeNames">
      <van-collapse-item v-for="(item, index) in switchList" :key="index" :name="index" class="collapse-content">
        <template #title>
          <div class="title-slot">
            <div class="title-slot-text">{{ item.name }}</div>
            <div class="switch-inner" @click.stop>
              <span v-if="switchObj[item.key]">异常</span>
              <van-switch v-model="switchObj[item.key]" size="20px" inactive-color="#00AA00" active-color="#E43122"/>
            </div>
          </div>
        </template>
        <div class="switch-content">
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
            <p class="file-title">上传图片<span class="grey-text"></span><span class="require-text">*</span></p>
            <div class="upload-content">
              <div class="upload-item">
                <svg class="icon upload-img" aria-hidden="true">
                  <use xlink:href="#icon-lxp-h5upload-mob"></use>
                </svg>
                <!-- <span class="upload-text">近景图</span> -->
              </div>
            </div>
          </div>
        </div>
      </van-collapse-item>
    </van-collapse>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const activeNames = ref(['1'])

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
  { name: '车辆故障码检查与清除', key: 'sags' },
  { name: '车辆起步与刹车', key: 'broken' },
  { name: '车辆灯光检查', key: 'replace' },
  { name: '电动尾门检查', key: 'gap' },
  { name: '交付模式退出', key: 'compensation' },
  { name: '重置中控屏里程A数据', key: 'repair' },
  { name: '回复出厂设置检查', key: 'scratch' }
])
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
