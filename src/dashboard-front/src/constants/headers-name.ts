/*
 * TencentBlueKing is pleased to support the open source community by making
 * 蓝鲸智云 - API 网关(BlueKing - APIGateway) available.
 * Copyright (C) 2025 Tencent. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *     http://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

// 导出一个包含常见HTTP请求头名称的数组
export default [
  'Accept', // 指定客户端可接受的内容类型
  'Accept-Charset', // 指定客户端可接受的字符集
  'Accept-Encoding', // 指定客户端可接受的内容编码
  'Accept-Language', // 指定客户端可接受的语言
  'Access-Control-Request-Headers', // 用于预检请求，列出将被使用的HTTP头
  'Access-Control-Request-Method', // 用于预检请求，列出将被使用的HTTP方法
  'Authorization', // 包含认证信息
  'Cache-Control', // 指定缓存机制
  'Content-MD5', // 提供消息体的MD5校验值
  'Content-Length', // 指定消息体的长度
  'Content-Transfer-Encoding', // 指定消息体的传输编码
  'Content-Type', // 指定消息体的媒体类型
  'Cookie', // 包含HTTP cookies
  'Date', // 指定消息发送的日期和时间
  'Expect', // 指定客户端要求的特定行为
  'From', // 指定发送请求的用户的电子邮件地址
  'Host', // 指定请求的主机名和端口号
  'If-Match', // 仅在实体标签匹配时发送请求
  'If-Modified-Since', // 仅在资源自指定日期后修改过时发送请求
  'If-None-Match', // 仅在实体标签不匹配时发送请求
  'If-Range', // 仅在资源未修改时发送部分请求
  'If-Unmodified-Since', // 仅在资源自指定日期后未修改时发送请求
  'Keep-Alive', // 保持连接持久
  'Max-Forwards', // 限制请求的最大跳数
  'Origin', // 指定请求的源站
  'Pragma', // 包含实现特定的指令
  'Proxy-Authorization', // 包含代理认证信息
  'Range', // 请求资源的部分内容
  'Referer', // 指定请求的来源页面
  'TE', // 指定传输编码
  'Trailer', // 指定消息体的尾部字段
  'Transfer-Encoding', // 指定消息体的传输编码
  'Upgrade', // 请求升级到另一个协议
  'User-Agent', // 指定客户端软件的信息
  'Via', // 显示消息经过的中间节点
  'Warning', // 包含警告信息
  'X-Requested-With', // 指定请求是通过AJAX发出的
  'X-Do-Not-Track', // 指定用户不希望被跟踪
  'DNT', // 指定用户不希望被跟踪
  'x-api-key', // 包含API密钥
];
