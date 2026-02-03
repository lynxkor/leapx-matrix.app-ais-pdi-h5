<template>
  <div class="inner-content">
    <van-collapse v-model="activeNames">
      <van-collapse-item v-for="(item, index) in 2" :key="index" title="标题1" :name="index" value="异常" value-class="error-text" class="collapse-content">
        <div class="switch-content">
          <van-row>
            <van-col class="check-item" v-for="(item, index) in switchList" :key="index" span="24">
              <span class="check-item-text">{{ item.name }}</span>
              <div class="switch-inner">
                <span v-if="switchObj[item.key]">异常</span>
                <van-switch v-model="switchObj[item.key]" size="20px" inactive-color="#00AA00" active-color="#E43122"/>
              </div>
            </van-col>
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
          </van-row>
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
  { name: '凹凸不平', key: 'sags' },
  { name: '损坏', key: 'broken' },
  { name: '更换', key: 'replace' },
  { name: '间隙不均', key: 'gap' },
  { name: '索赔', key: 'compensation' },
  { name: '修理', key: 'repair' },
  { name: '划痕', key: 'scratch' }
])
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
