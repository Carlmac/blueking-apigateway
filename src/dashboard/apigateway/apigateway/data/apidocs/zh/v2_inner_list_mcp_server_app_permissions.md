### 描述

mcp_server 已申请权限列表


### 输入参数

#### 请求参数

| 参数名称              | 参数类型    | 必选 | 描述                  |
|-------------------|---------|----|---------------------|
| target_app_code   | string  | 是  | 申请权限的应用，应于当前请求的应用一致 |


### 响应示例

```json
{
  "data": [
    {
      "mcp_server": {
        "id": 1,
        "name": "bk-apigateway-prod-test",
        "description": "test",
        "tools_count": "1",
        "doc_link": ""
      },
      "permission": {
        "status": "owned",
        "action": "",
        "expires_in": null
      }
    }
  ]
}
```

### 响应参数说明

| 字段    | 类型   | 描述                               |
| ------- | ------ | ---------------------------------- |
| data    | array  | 结果数据，详细信息请见下面说明     |

#### data

| 参数名称             | 参数类型   | 描述                           |
|------------------|--------|------------------------------|
| mcp_server       | object | mcp_server 数据，详细信息请见下面说明     |
| permission       | object | mcp_server 权限数据，详细信息请见下面说明   |


#### data.mcp_server

| 参数名称            | 参数类型   | 描述                |
|-----------------|--------|-------------------|
| id              | int    | mcp_server ID     |
| name            | string | mcp_server 名称     |
| description     | string | mcp_server 描述     |
| tools_count     | int    | mcp_server 工具数量   |
| doc_link        | string | mcp_server 文档访问地址 |


#### data.permission

| 参数名称           | 参数类型     | 描述                                                                        |
|----------------|----------|---------------------------------------------------------------------------|
| expires_in     | int      | 有效期                                                                       |
| status         | string   | 权限状态（approved：已审批，rejected：已拒绝，pending：申请中，need_apply：待申请，owned：已申请，且未过期） |
| action         | string   | 权限操作                                                                      |
