import { get, post, postJson } from './request'

export function getList (data) {
  return post('/datacenter/vehiclePartsMaintenance/page', data)
}

// 车系列表
export function getVehicleSeriesList (data) {
  return post('/datacenter/app/materials/vehicleSeries/list', data)
}

// 车型列表
export function getVehicleModelList (data) {
  return post('/datacenter/app/materials/vehicleModel/list', data)
}

// pdi列表
export function getPdiList (data) {
  return post('/vehstock/app/store/storeVehiclePdi/page', data)
}

// pdi详情(入库、在库)
export function getPdiDetails (data) {
  return postJson('/vehstock/app/store/storeVehiclePdi/getPdiEntryDetails', data)
}

// pdi详情(异常)
export function getPdiRepairDetails (data) {
  return postJson('/vehstock/app/store/storeVehiclePdi/getRepairConfirmDetails', data)
}

// pdi录入(入库、在库)
export function addPdiEntry (data) {
  return post('/vehstock/app/store/storeVehiclePdi/addPdiEntry', data)
}

// pdi录入(异常)
export function addRepairConfirm (data) {
  return post('/vehstock/app/store/storeVehiclePdi/addRepairConfirm', data)
}
// 查询当前用户拥有的所有资源列表
export function getOwnerTree (data) {
  return get('/passport/resourceInfo/owner/tree', data)
}
