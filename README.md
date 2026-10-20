# flclash-config

给 **FlClash / mihomo** 用的配置覆写脚本。

把机场订阅里那份原始、杂乱的配置，重建成一套干净好用的配置：剔除广告与信息节点、按地区分组、按服务分流、DNS 也按规则集分流。

结构参考 [AIsouler/MyClash](https://github.com/AIsouler/MyClash) 的 `mihomoScript.js`，接口遵循 FlClash 扩展脚本约定（`function main(config)` 接收订阅配置、返回改写后的配置）。

---

## 使用方法

1. 打开 FlClash → **配置**（Profiles）→ 点进你的订阅 → 编辑
2. 找到 **扩展脚本** 区块，点 **前往配置脚本** → **添加**
3. **标签** 随便填（例如 `aqiyoung`），**URL** 填下面的链接，点 **同步** 拉取脚本内容
4. 回到订阅编辑页 → **扩展脚本** → 勾选刚添加的脚本（脚本模式）
5. 保存并更新一次订阅，配置即生效

### 脚本链接

```
https://cdn.jsdelivr.net/gh/aqiyoung/flclash-config@main/flclash.js
```

备选链接：

| 链接 | 说明 |
| --- | --- |
| `https://raw.githubusercontent.com/aqiyoung/flclash-config/main/flclash.js` | 改动即时生效，但国内可能被墙 |
| `https://gh-proxy.com/https://raw.githubusercontent.com/aqiyoung/flclash-config/main/flclash.js` | raw 的国内加速代理，实测即时生效 |
| `https://cdn.jsdelivr.net/gh/aqiyoung/flclash-config@<commit>/flclash.js` | 把 `<commit>` 换成最新 commit 的短哈希（如 `@22fc01e`） |

> **关于更新延迟**
>
> jsDelivr 对分支 `@main` 的缓存是 **12 小时**（响应头 `s-maxage=43200`），所以脚本改动后：
> - 最长可能要等半天才会全量生效；
> - 而且不同网络、不同边缘节点可能拿到**不同版本**，会看到新旧混用的情况。
>
> 另外，在 URL 后面加 `?v=xxx` 之类的参数**没有用**——jsDelivr 的缓存键不包含 query，实测过。
>
> 想立刻拿到最新版，二选一：
> 1. 把 URL 换成上面的 **raw** 或 **gh-proxy** 链接；
> 2. 把 jsDelivr 链接里的 `@main` 换成**最新 commit 的短哈希**（例如 `...@22fc01e/flclash.js`）。
>    哈希一变就是全新的缓存键，立刻生效；同一个哈希的内容永远不会变。

---

## 它做了什么

| 能力 | 说明 |
| --- | --- |
| **节点治理** | 机场把「剩余流量 / 到期时间 / 官网」这类**信息节点当成节点**投放，脚本会直接把它们从配置里剔除；同时剥离零宽字符、补全地区国旗、按名字去重、修复 `dialer-proxy` 的改名引用 |
| **地区分组** | 按节点名自动归类 **香港 / 日本 / 美国 / 新加坡 / 台湾**，每个地区生成一个手动组和一个 `地区-自动选择` 测速组；没归类的节点进「其他节点」 |
| **服务分流** | 20 个常用服务分组：GoogleFCM / YouTube / Google / ChatGPT / GitHub / OneDrive / Microsoft / APPLE / Telegram / Steam / Twitter / Meta / Line / TikTok / NETFLIX / Disney / Spotify / PikPak / Crypto / AdBlock |
| **国内直连** | 国内域名、国内 IP、私有网络、Steam 下载、NVIDIA 等优先直连，不会被服务规则截走 |
| **DNS 分流** | `fake-ip` 模式；国内域名走国内 DNS、私有网络走系统 DNS、默认走境外 DNS；`hosts` 修复 Google Play 下载、屏蔽 B 站 PCDN |
| **内核参数** | 补 `find-process-mode`、`ntp`，统一各测速参数 |

### 生成的策略组

```
GLOBAL
└── 默认代理                  ← 所有节点的总入口，默认指向「自动选择」
    ├── 自动选择 (url-test)   ← 所有节点自动测速，排除直连类出口
    ├── 故障转移 (fallback)
    ├── 负载均衡 (load-balance, sticky-sessions)
    ├── 各服务分组             ← 默认指向「默认代理」
    ├── 漏网之鱼               ← 兜底
    ├── 直连                   ← 5 个直连出口（双栈 / v4走先 / v6优先 / 仅v4 / 仅v6）
    └── 各地区组 + 其他节点
```

### 规则顺序

```
1. 私有网络 / 国内域名 / 国内 IP / Steam·NVIDIA 等  → 直连
2. （可选）屏蔽国外 QUIC：非中国大陆的 UDP/443 → REJECT，逼国外流量回落 TCP
3. 自建域名 / 指定进程（PUBG）                       → 默认代理
4. 各服务规则（AdBlock 置顶）
5. proxylite / geolocation-!cn                      → 默认代理
6. 国内 IP 兜底                                      → 直连
7. MATCH                                            → 漏网之鱼
```

---

## 开关

脚本开头的 `options` 对象集中管理所有开关，改完提交即可。

### 策略组

| 开关 | 默认 | 说明 |
| --- | --- | --- |
| `自动选择` | `true` | 所有节点自动测速（`url-test`） |
| `故障转移` | `true` | 按顺序失败切换（`fallback`） |
| `负载均衡` | `true` | 按会话分摊（`load-balance`） |

### 地区分组

| 开关 | 默认 | 说明 |
| --- | --- | --- |
| `生成地区自动选择组` | `true` | 生成 `香港-自动选择` 这类测速组 |
| `隐藏地区手动选择组` | `false` | `true` 则隐藏「香港」这类手动组，只留自动组 |

### 服务分流

键名即策略组名，`false` 时该分组与对应规则会一起移除。

`GoogleFCM` `YouTube` `Google` `ChatGPT` `GitHub` `OneDrive` `Microsoft` `APPLE` `Telegram` `Steam` `Twitter` `Meta` `Line` `TikTok` `NETFLIX` `Disney` `Spotify` `PikPak` `Crypto` `AdBlock`

### 行为

| 开关 | 默认 | 说明 |
| --- | --- | --- |
| `过滤非地区节点` | `true` | 剔除名字像「剩余流量 / 到期 / 官网」的非地区节点 |
| `屏蔽国外QUIC` | `true` | 非中国大陆的 UDP/443 一律拒绝，规避 QUIC 走代理的不稳定 |
| `分流组添加所有节点` | `false` | `true` 会把全部节点塞进每个分流组（列表会很长） |

---

## 已知限制

- **订阅必须内联 `proxies`**。如果订阅使用 `proxy-providers`，脚本会直接抛错——因为节点过滤和地区分组需要能读到节点列表。绝大多数机场订阅都是内联 `proxies`。
- **`ipv6` 保持 `false`**（沿用原脚本设置）。如果你的网络有原生 IPv6 并且希望走 IPv6，需要同时改全局 `ipv6` 和 `dns.ipv6`。
- **`hosts` 会屏蔽 B 站 PCDN**（`+.mcdn.bilivideo.com` 等解析到 `0.0.0.0`）。不需要的话删掉 `buildDnsAndHosts()` 里那四行即可。
- **`external-controller` 的 `secret` 是硬编码的**，且这个仓库是公开的。如果你开了 `allow-lan` 并暴露了 9090 端口，建议换成自己的随机串。
- 图标与规则集统一走 **cdn.jsdmirror.com**（jsDelivr 国内镜像）。要换 CDN 只需改 `CDN_HOST` 一个常量，`ICON`、`RULESET` 和直连规则 `DOMAIN,...` 都从它派生。
- **组图标由 FlClash 自己下载，且每个图标只拉一次**。那一次没成功（超时/被限速）就退化成显示组名首字母（GLOBAL → `G`、Steam → `S`），刷新界面不会重试，只有重启 FlClash 才会重来。图标请求若走代理容易失败，所以上面加了图标域名直连规则；直连反而更差的话，删掉 `buildGroupsAndRules()` 里那一行 `DOMAIN,...` 即可。

---

## 致谢

- 原脚本：hheshenghuan-cloud/ziji
- 结构与思路参考：[AIsouler/MyClash](https://github.com/AIsouler/MyClash)
- 规则集：[MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)、[DustinWin/ruleset_geodata](https://github.com/DustinWin/ruleset_geodata)、[qichiyuhub/rule](https://github.com/qichiyuhub/rule)、[hheshenghuan-cloud/ziji](https://github.com/hheshenghuan-cloud/ziji)
- 图标：[Koolson/Qure](https://github.com/Koolson/Qure)
