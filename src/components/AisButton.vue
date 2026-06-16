<template>
  <div class="btn-item" :style="getStyle()" v-html="renderText()" @click="onClick">
  </div>
</template>

<script setup>
import { reactive, useSlots } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'primary'
  },
  plain: {
    type: Boolean,
    default: false
  },
  round: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#00AA00'
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const slots = useSlots()

const style = reactive({})

const getStyle = () => {
  const { color, plain, round, loading, disabled } = props
  style.color = plain ? color : '#fff'
  if (!plain) {
    style.background = color
  } else {
    style.border = `1px solid ${color}`
  }
  if (round) {
    style.borderRadius = '38px'
  } else {
    style.borderRadius = '4px'
  }
  if (loading || disabled) {
    style.opacity = 0.6
  } else {
    style.opacity = 1
  }
  return style
}

const onClick = (event) => {
  if (props.loading || props.disabled) {
    return false
  }
  emit('click', event)
}

const renderText = () => {
  let text
  if (props.loading) {
    text = `<span>${slots.default()[0]?.children}</span>`
  } else {
    // 获取默认插槽内容
    if (slots.default) {
      text = slots.default()[0]?.children || ''
    }
  }

  if (text) {
    return text
  }
}
</script>

<style lang="scss" scoped>
  .btn-item{
    padding: 0 18px;
    font-family: "PingFang SC", sans-serif;
    font-size: 12px;
    min-width: 60px;
    height: 28px;
    box-sizing: border-box;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
