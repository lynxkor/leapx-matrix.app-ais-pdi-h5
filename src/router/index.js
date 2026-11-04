import { createRouter, createWebHistory } from 'vue-router'
import { useGlobalStore } from '@/stores/global'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Demo-首页'
      }
    },
    {
      path: '/example',
      name: 'example',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/example/ListView.vue'),
      meta: {
        title: 'Demo-商品列表'
      }
    },
    {
      path: '/example/detail',
      name: 'exampleDetail',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/example/DetailView.vue'),
      meta: {
        title: 'Demo-商品详情'
      }
    },
    {
      path: '/',
      name: 'baseLayout',
      component: () => import('@/libs/layout/baseLayout.vue'),
      children: [
        {
          path: '/pdi/list',
          name: 'PdiListView',
          component: () => import('../views/pdi/ListView.vue'),
          meta: {
            title: '门店整车PDI',
            closeWindow: 1,
            hideHeader: false,
            keepAlive: true
          }
        },
        {
          path: '/pdi/detail',
          name: 'PdiDetailView',
          component: () => import('../views/pdi/DetailView.vue'),
          meta: {
            title: '门店整车PDI详情',
            hideHeader: false,
            keepAlive: false
          }
        },
        {
          path: '/pdi/search',
          name: 'PdiSearch',
          component: () => import('../views/pdi/SearchPage.vue'),
          meta: {
            title: 'PDI搜索',
            hideHeader: true, // 隐藏默认导航栏，使用自定义头部
            keepAlive: false
          }
        },
        {
          path: '/abnormalRecord/list',
          name: 'AbnormalRecordListView',
          component: () => import('../views/abnormalRecord/ListView.vue'),
          meta: {
            title: '低电量车',
            keepAlive: true
          }
        },
        {
          path: '/abnormalRecord/search',
          name: 'AbnormalRecordSearch',
          component: () => import('../views/abnormalRecord/SearchPage.vue'),
          meta: {
            title: '搜索',
            hideHeader: true,
            keepAlive: false
          }
        },
        {
          path: '/vehicleInventory/list',
          name: 'VehicleInventoryListView',
          component: () => import('../views/vehicleInventory/ListView.vue'),
          meta: {
            title: '门店整车库存',
            keepAlive: true,
            closeWindow: 1
          }
        },
        {
          path: '/vehicleInventory/search',
          name: 'VehicleInventorySearch',
          component: () => import('../views/vehicleInventory/SearchPage.vue'),
          meta: {
            title: '搜索',
            hideHeader: true,
            keepAlive: false
          }
        },
        {
          path: '/inventoryLedger/list',
          name: 'InventoryLedgerListView',
          component: () => import('../views/inventoryLedger/ListView.vue'),
          meta: {
            title: '门店整车台账',
            keepAlive: true
          }
        },
        {
          path: '/inventoryLedger/search',
          name: 'InventoryLedgerSearch',
          component: () => import('../views/inventoryLedger/SearchPage.vue'),
          meta: {
            title: '搜索',
            hideHeader: true,
            keepAlive: false
          }
        },
        {
          path: '/vdcInventory/list',
          name: 'VdcInventoryListView',
          component: () => import('../views/vdcInventory/ListView.vue'),
          meta: {
            title: '厂端整车库存',
            keepAlive: true
          }
        },
        {
          path: '/vdcInventory/search',
          name: 'VdcInventorySearch',
          component: () => import('../views/vdcInventory/SearchPage.vue'),
          meta: {
            title: '搜索',
            keepAlive: false
          }
        },
        {
          path: '/riskCheck/taskList',
          name: 'RiskCheckTaskListView',
          component: () => import('../views/riskCheck/TaskListView.vue'),
          meta: {
            title: '车辆排查任务',
            keepAlive: true
          }
        },
        {
          path: '/riskCheck/taskDetail',
          name: 'RiskCheckTaskDetailView',
          component: () => import('../views/riskCheck/TaskDetailView.vue'),
          meta: {
            title: '排查任务详情',
            keepAlive: false
          }
        },
        {
          path: '/riskCheck/auditList',
          name: 'RiskCheckAuditListView',
          component: () => import('../views/riskCheck/AuditListView.vue'),
          meta: {
            title: '排查审核记录',
            keepAlive: true
          }
        },
        {
          path: '/riskCheck/auditDetail',
          name: 'RiskCheckAuditDetailView',
          component: () => import('../views/riskCheck/AuditDetailView.vue'),
          meta: {
            title: '审核详情',
            keepAlive: false
          }
        },
        {
          path: '/riskCheck/vehicleDetail',
          name: 'RiskCheckVehicleDetailView',
          component: () => import('../views/riskCheck/VehicleDetailView.vue'),
          meta: {
            title: '车辆排查详情',
            keepAlive: false
          }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const globalStore = useGlobalStore()
  // 优先使用路由元信息中的标题
  // 注意：如果 hideHeader 为 true，则不设置标题（由页面自行处理，如搜索页面）
  if (!to.meta?.hideHeader) {
    globalStore.setTitle(to.meta.title || '')
    document.title = to.meta.title || ''
  } else {
    // 隐藏头部的页面（如搜索页）清空标题
    globalStore.setTitle('')
    document.title = to.meta.title || ''
  }

  next()
})

export default router
