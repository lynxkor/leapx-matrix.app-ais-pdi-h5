<template>
  <div class="repair-content">
    <van-collapse v-model="activeNames">
      <van-collapse-item v-for="(item, index) in 2" :key="index" title="前机舱与后备箱" :name="index" value="异常" value-class="error-text" class="collapse-content">
        <div class="switch-content">
          <van-row>
            <div class="file-content">
              <div class="error-text-content">
                <div class="error-text-item" v-for="(errorItem, errorIndex) in 10" :key="errorIndex">前机舱无液体{{ errorIndex + 2 }}</div>
              </div>
              <div class="reason-text">异常说明：我是异常说明我是异常说明我是异常说明我是异常说明我是异常说明</div>
              <div class="img-content">
                <img class="reason-img" v-for="(imgItem, imgIndex) in 5" :key="imgIndex"/>
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
          <span class="switch-text">外观检查异常是否修复外观检查异常是否修复外观检查异常是否修复</span>
          <div class="switch-ope">
            <span :style="{color: isAbnormal ? '#E43122' : '#00AA00'}">{{ isAbnormal ? '未修复' : '已修复' }}</span>
            <van-switch v-model="isAbnormal" size="20px" inactive-color="#00AA00" active-color="#E43122"/>
          </div>
        </div>
        <van-field
          class="textarea-content"
          v-model="remark"
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
import { ref } from 'vue'

const activeNames = ref(['1'])
const isAbnormal = ref(false)
const remark = ref('')

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
