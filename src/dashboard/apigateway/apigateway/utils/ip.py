#
# TencentBlueKing is pleased to support the open source community by making
# 蓝鲸智云 - API 网关(BlueKing - APIGateway) available.
# Copyright (C) 2025 Tencent. All rights reserved.
# Licensed under the MIT License (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
#     http://opensource.org/licenses/MIT
#
# Unless required by applicable law or agreed to in writing, software distributed under
# the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the License for the specific language governing permissions and
# limitations under the License.
#
# We undertake not to change the open source license (MIT license) applicable
# to the current version of the project delivered to anyone in the future.
#

import logging
from typing import List

logger = logging.getLogger(__name__)


def parse_ip_content_to_list(ip_content: str) -> List[str]:
    """ip_content is a text with ip list, line breaker and comment,
    parse it, and remove the comment and blank line, deduplicate, return a list of ip

    in:  1.1.1.1\n2.2.2.2\r\n#comment\n1.1.1.1
    out: ["1.1.1.1", "2.2.2.2"]
    """
    # split with \n\r, then ignore blank line and `# comment`
    ips = set()
    ip_lines = ip_content.splitlines()
    for ip_line_raw in ip_lines:
        ip_line = ip_line_raw.strip()
        if not ip_line or ip_line.startswith("#"):
            continue

        # http://www.tcpipguide.com/free/t_IPv6IPv4AddressEmbedding-2.htm
        # >>> ipaddress.ip_interface("::ffff:192.1.1.1/96")
        #     IPv6Interface('::ffff:c001:101/96')
        # while the apisix not support the `::ffff:192.1.1.1/96`, we need to convert here

        ip_line_lower = ip_line.lower()
        if ip_line_lower.startswith(("0:0:0:0:0:ffff:", "::ffff:")) and "/" in ip_line_lower:
            logger.warning("ip_line: %s is ipv4-mapped ipv6 address, skip", ip_line)
            # the convert would not work for newer python version, so we skip it
            # "::ffff:192.1.1.1/96" -> "::ffff:c001:101/96"
            # ips.add(str(ipaddress.ip_interface(ip_line)))
            continue

        ips.add(ip_line)

    return list(ips)
