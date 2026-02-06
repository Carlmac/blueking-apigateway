// 插件表单填写示例
import { t } from '@/locales';

export const PLUGIN_FORM_EXAMPLE_MAP: { [pluginCode: string]: string } = {
  'proxy-cache': t('作用：可缓存 GET 请求的响应数据 300 秒\n\n cache_method: [\\"GET\\"] \n cache_ttl: 300'),
  'bk-user-restriction': t('作用：仅允许用户 admin 请求当前接口\n\n类型：白名单\n白名单： [\\"admin\\"]\nmessage: \\"The bk-user is not allowed\\"'),
  'bk-request-body-limit': t('作用：限制请求体大小为 100 B\n\n max_body_size: 100'),
  'bk-access-token-source': t('作用：来源为 bearer 时，从请求 header 中获取 Authorization，来源为 api_key 时，从请求 header 中获取 X-API-KEY \n\n source: bearer'),
  'ai-proxy': t('作用：配置 API 密钥、模型和其他参数，将用户提示代理到 OpenAI\n\n provider: \\"openai\\" \n auth: {\\"header\\": \\"Authorization\\": \\"Bearer key\\"} \n options: {\\"model\\": \\"gpt-4\\"}'),
  'ai-rate-limiting': t('作用：配置每秒限制20个请求，超出限制则返回 503 状态码和错误响应。\n\n limit: 20 \n time_window: 1 \n show_limit_quota_header: true \n limit_strategy: total_tokens \n rejected_code: 503 \n rejected_msg: \\"test...\\"'),
  'redirect': t('重定向 URI: /test/default.html, \nHTTP 响应码: 301\n'),
  'bk-mock': t('作用：返回 json response，状态码为 200，并且携带响应头 foo:bar\\n\\n响应状态码：200\\n响应体：{\\"hello\\": \\"world\\"}\\n响应头：\\n      Content-Type: application/json\\n      foo: bar'),
  'response-rewrite': t('\\"status_code\\": 200, \n\\"body\\": {\\"code\\":\\"ok\\",\\"message\\":\\"new json body\\"}, \n\\"headers\\": {\n  \\"add\\": [\\"X-Server-balancer-addr: test\\"],\n  \\"set\\": {\\"X-Server-id\\": 3},\n  \\"remove\\": [\\"X-TO-BE-REMOVED\\"]\n}, \n \\"vars\\": [[[\\"arg_name\\", \\"==\\", \\"jack\\"], [\\"arg_age\\", \\"==\\", 18]]]\n'),
  'fault-injection': t('作用：当请求参数 name 等于 jack，并且 age 等于 18 的时候，则返回 400 拒绝状态码和响应内容\n\n\\"abort\\": {\n    \\"http_status\\": 400,\n    \\"body\\": \\"not valid request params\\",\n    \\"vars\\": [[[\\"arg_name\\", \\"==\\", \\"jack\\"], [\\"arg_age\\", \\"==\\", 18]]]\n}\n'),
  'request-validation': t('作用：当请求体中没有包含 boolean_payload 时，则返回 400 拒绝状态码和拒绝信息\n\n\\"body_schema\\": {\\"type\\": \\"object\\",\\"required\\": [\\"bool_payload\\"],\\"properties\\": {\\"bool_payload\\": {\\"type\\": \\"boolean\\"}}}\n\\"header_schema\\": {}\n\\"rejected_code\\": 400\n\\"rejected_msg\\": \\"not valid request body\\"'),
  'api-breaker': t('作用：当后端服务返回状态码 500 或 503，并达到 3 次，则触发熔断，返回响应体 helloworld，状态码为 502，并且携带响应头 foo:bar。\\n第一次触发不健康状态时，熔断 2 秒。超过熔断时间后，将重新开始转发请求到上游服务，如果继续返回 500 状态码，当计数再次达到 3 次时，熔断 4 秒。依次类推（2，4，8，16，……），直到达到预设的最大熔断时间 300 秒。\\n当上游服务处于不健康状态时，如果后端服务返回状态码 200，并达到 2 次时，则认为上游服务恢复至健康状态。\\n\\n\\nbreak_response_code：502\\nbreak_response_body：helloworld\\nbreak_response_headers： [ { \\"key\\": \\"foo\\", \\"value\\": \\"bar\\" } ]\\nmax_breaker_sec：300\\nunhealthy： { \\"http_statuses\\": [ 500, 503 ], \\"failures\\": 3 }\\nhealthy： { \\"http_statuses\\": [ 200 ], \\"successes\\": 2 }'),
  'bk-cors': t('作用：允许 https://a.example.com:8081, https://b.example.com:8081 这两个站点发起跨域请求\n\nallow_origins: \nallow_origins_by_regex: ^https://.*\\.example\\.com:8081$\nallow_methods: GET,POST,PUT,PATCH,HEAD,DELETE,OPTIONS\nallow_headers: **\nexpose_headers: \nmax_age: 86400\nallow_credential: false'),
  'bk-ip-restriction': t('作用：仅允许 IP 192.168.1.1 和 192.168.1.1 请求当前接口\n\n类型：白名单\n白名单： \n      # comment\n       192.168.1.1\n       192.168.1.2'),
  'bk-header-rewrite': t('作用：设置 header `X-Api-Version: 1`，并且删除 header `X-test`\n\n设置：X-Api-Version: 1\n删除：X-test'),
  'bk-rate-limit': t('作用：默认每个应用 100 次/秒，应用 demo 200 次/秒\n\n默认频率限制：次数：100 时间范围：秒\n特殊应用频率限制：次数：200  时间范围：秒  蓝鲸应用 ID: demo'),
  'bk-status-rewrite': '',
  'bk-legacy-invalid-params': '',
  'bk-username-required': '',
};

export default PLUGIN_FORM_EXAMPLE_MAP;
