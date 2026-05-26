import { defineStore } from 'pinia'
import { getMaintainEnum } from '@/libs/api/common'

export const useGlobalStore = defineStore('global', {
  state: () => ({
    title: '',
    // 枚举选项列表
    itemOptions: {
      repairItemTypeName: [], // 维修类型
      checkoutTypeName: [], // 结算方式
      warrantyTypeName: [] // 保修类型
    }
  }),
  actions: {
    setTitle(title) {
      this.title = title
    },
    // 获取枚举数据
    getEnumData() {
      getMaintainEnum('MaintenanceTypeEnum').then((res) => {
        this.itemOptions.repairItemTypeName = (res.data || []).map((item) => ({
          repairItemTypeId: item.code,
          repairItemTypeName: item.message,
          label: item.message,
          value: item.code
        }))
      })
      getMaintainEnum('StatementTypeEnum').then((res) => {
        this.itemOptions.checkoutTypeName = (res.data || []).map((item) => ({
          checkoutTypeId: item.code,
          checkoutTypeName: item.message,
          label: item.message,
          value: item.code
        }))
      })
      getMaintainEnum('WarrantyTypeEnum').then((res) => {
        this.itemOptions.warrantyTypeName = (res.data || []).map((item) => ({
          warrantyTypeId: item.code,
          warrantyTypeName: item.message,
          label: item.message,
          value: item.code
        }))
      })
    }
  }
})
