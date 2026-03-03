<script setup>
// ========== 基础依赖导入 ==========
import { defineEmits, ref, computed } from 'vue'
import { closeToast, showLoadingToast } from 'vant'

// ========== 组件属性定义 ==========
const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

// ========== 事件定义 ==========
const emit = defineEmits(['update:show', 'cancel', 'confirm'])

// ========== 状态管理 ==========
const formRef = ref()
const formData = ref({
  value1: '',
  value2: '',
  value3: 'abc',
  value4: '',
  value5: '静态文本'
})
const pattern = /\d{6}/

// ========== 响应式状态 ==========
const innerShow = computed({
  get: () => props.show,
  set: (val) => {
    console.log('set')
    emit('update:show', val)
  }
})

// ========== 表单校验逻辑 ==========
const validators = {
  // 正则校验
  pattern: (val) => /1\d{10}/.test(val),
  
  // 自定义校验提示
  message: (val) => `${val} 不合法，请重新输入`,
  
  // 异步校验
  async: (val) => new Promise((resolve) => {
    showLoadingToast('验证中...')
    setTimeout(() => {
      closeToast()
      resolve(val === '1234')
    }, 1000)
  })
}

// ========== 事件处理 ==========
const handleCancel = () => {
  innerShow.value = false
}

const handleConfirm = () => {
  formRef.value.validate().then((res) => {
    console.log('success', res)
    emit('confirm')
  }).catch((err) => {
    console.log('failed', err)
  })
}

const onFailed = (errorInfo) => {
  console.log('failed', errorInfo)
}
</script>

<template>
  <van-action-sheet v-model:show="innerShow" title="标题" :closeable="false">
    <div class="m-example-action-sheet">
      <div class="g-content">
        <van-form ref="formRef" @failed="onFailed">
          <van-cell-group inset>
            <!-- 通过 pattern 进行正则校验 -->
            <van-field
              v-model="formData.value1"
              name="pattern"
              label="文本1"
              placeholder="正则校验"
              :rules="[{ pattern, message: '请输入正确内容' }]"
            />
            <!-- 通过 validator 进行函数校验 -->
            <van-field
              v-model="formData.value2"
              name="validator"
              label="文本2"
              placeholder="函数校验"
              :rules="[{ validator: validators.pattern, message: '请输入正确内容' }]"
            />
            <!-- 通过 validator 返回错误提示 -->
            <van-field
              v-model="formData.value3"
              label="文本3"
              name="validatorMessage"
              placeholder="校验函数返回错误提示"
              :rules="[{ validator: validators.message }]"
            />
            <!-- 通过 validator 进行异步函数校验 -->
            <van-field
              v-model="formData.value4"
              label="文本4"
              name="asyncValidator"
              placeholder="异步函数校验"
              :rules="[{ validator: validators.async, message: '请输入正确内容' }]"
            />
            <van-field
              v-model="formData.value5"
              label="文本5"
              name="text5"
              readonly
            />
          </van-cell-group>
        </van-form>
      </div>
      <div class="g-btns">
        <van-button type="default" @click="handleCancel">取消</van-button>
        <van-button type="primary" @click="handleConfirm">提交</van-button>
      </div>
    </div>
  </van-action-sheet>
</template>

<style lang="scss">
.m-example-action-sheet {
  position: relative;
  height: 70vh;
  
  .g-btns {
    position: absolute;
    width: 100%;
    bottom: 0;
    padding: 20px 0;
    background-color: #f9f9f9;
    text-align: center;
  }

  .van-button + .van-button {
    margin-left: 50px;
  }
}
</style>
