import type { GatewayMemberRole } from '@/services/types/responses/gateway-members';

export interface IGatewayMemberCreateInputSLZ {
  usernames: string[]
  role: GatewayMemberRole
}
