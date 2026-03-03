<script setup>
import { ref } from 'vue'

const list = ref([
  { title: '商品列表', path: '/example' }
])
</script>

<template>
  <main>
    <van-list>
      <van-cell v-for="item in list" :key="item.path" :title="item.title">
        <RouterLink :to="item.path">
          <van-icon name="arrow" />
        </RouterLink>
      </van-cell>
    </van-list>
  </main>
</template>
