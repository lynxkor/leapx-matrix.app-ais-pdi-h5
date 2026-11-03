import { post, postJson } from './request'

// ==================== APP 端 风险车辆排查 ====================
// 上下文前缀与 pdi 保持一致：/vehstock/app/...

// 任务分页列表（门店维度统计）
export function getRiskCheckTaskList(data) {
  return post('/vehstock/app/risktask/riskCheckTask/page', data)
}

// 任务详情
export function getRiskCheckTaskDetail(data) {
  return postJson('/vehstock/app/risktask/riskCheckTask/detail', data)
}

// 车辆清单分页（门店维度筛选）
export function getRiskCheckVehiclePage(data) {
  return post('/vehstock/app/risktask/riskCheckTask/detail/page', data)
}

// 车辆明细详情（对齐后端 VehicleRiskCheckTaskAppController#detailVin）
// 请求参数：明细的-子任务ID checkChildTaskId + 明细ID id（后端 getByChildTaskIdAndVin(childTaskId, detailId)）
export function getRiskCheckVehicleDetail(data) {
  return postJson('/vehstock/app/risktask/riskCheckTask/detail/vin', data)
}

// 门店提交排查结果
// 🔍 对齐后端 VehicleRiskCheckTaskAppController#submitCheckResult
//   （旧路径 /app/risktask/riskCheckAudit/submit 后端不存在，必 404）
export function submitRiskCheckResult(data) {
  return postJson('/vehstock/app/risktask/riskCheckTask/submitCheckResult', data)
}

// 审核列表分页（门店维度，2 Tab：待审核/已审核）
export function getRiskCheckAuditPage(data) {
  return post('/vehstock/app/risktask/riskCheckAudit/page', data)
}

// 审核详情（对齐后端 VehicleRiskCheckAuditAppController#detail，入参 LpBaseParam：{ id }）
export function getRiskCheckAuditDetail(data) {
  return postJson('/vehstock/app/risktask/riskCheckAudit/detail', data)
}

// 审核动作（通过/不通过；对齐后端 VehicleRiskCheckAuditAppController#approve）
// 入参：{ auditRecordId, pass, auditOpinion }；不通过时 auditOpinion 必填（G11），≤200字（G12）
export function approveRiskCheckAudit(data) {
  return postJson('/vehstock/app/risktask/riskCheckAudit/approve', data)
}
