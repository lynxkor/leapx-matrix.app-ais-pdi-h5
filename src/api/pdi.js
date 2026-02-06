import { post, postJson } from './request'

export function getList(data) {
  return post('/datacenter/vehiclePartsMaintenance/page', data)
}

// pdi列表
export function getPdiList(data) {
  return post('/vehstock/app/store/storeVehiclePdi/page', data)
}

// pdi详情(入库、在库)
export function getPdiDetails(data) {
  return postJson('/vehstock/app/store/storeVehiclePdi/getPdiEntryDetails', data)
}

// pdi详情(异常)
export function getPdiRepairDetails(data) {
  return postJson('/vehstock/app/store/storeVehiclePdi/getRepairConfirmDetails', data)
}
