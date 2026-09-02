export type GatewayMemberRole = 'admin' | 'operator';

export interface IGatewayMemberOutput {
  username: string
  roles: GatewayMemberRole[]
}
