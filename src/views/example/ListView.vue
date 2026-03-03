<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getList } from '@/api/example'

const list = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const value = ref('')
const pageSize = 20

const onLoad = () => {
  // 异步更新数据
  // setTimeout 仅做示例，真实场景中一般为 ajax 请求
  setTimeout(() => {
    if (refreshing.value) {
      list.value = []
      refreshing.value = false
    }

    for (let i = 0; i < pageSize; i++) {
      list.value.push(list.value.length + 1)
    }

    // 加载状态结束
    loading.value = false

    // 数据全部加载完成
    if (list.value.length >= pageSize * 4) {
      finished.value = true
    }
  }, 1000)
}

const onSearch = (val) => {
  console.log('onSearch', val)
  alert(val)
}

const onRefresh = () => {
  // 清空列表数据
  finished.value = false

  // 重新加载数据
  // 将 loading 设置为 true，表示处于加载状态
  loading.value = true
  onLoad()
}

getList()
</script>

<template>
  <div class="m-example-list-c">
    <van-search 
      v-model="value"
      placeholder="请输入搜索关键词"
      @search="onSearch"
    />
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
        @refresh="onRefresh"
      >
        <RouterLink 
          v-for="item in list" 
          :key="item"
          class="m-list-item"
          :to="{ path: '/example/detail', query: { id: item } }"
        >
          <van-image
            lazy-load
            width="100%"
            fit="cover"
            :src="`https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg?t=${item}`"
          />
          <div class="">
            <p>{{ item }}</p>
          </div>
        </RouterLink>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<style lang="scss">
.m-example-list-c {
  .m-list-item {
    display: inline-block;
    width: 44%;
    margin-top: 20px;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    margin-left: 4%;
    font-size: 0;

    .van-image {
      aspect-ratio: 1 / 1; /* 宽高比 1:1 */
      overflow: hidden;
    }

    p {
      font-size: 16px;
    }
  }
}
</style>
