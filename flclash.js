/**
 * FlClash / Mihomo 配置脚本
 * 用法：在 FlClash 的脚本配置中导入本文件，然后将其应用到订阅配置。
 * 脚本接收订阅解析后的配置对象，并返回修改后的配置对象。
 *
 * 改动（相对 hheshenghuan-cloud/ziji）：
 *   1. 新增「自动选择」(url-test) 与「故障转移」(fallback) 两个自动组；默认测速，并排除机场信息节点。
 *   2. 各策略组默认首选「自动选择」，其次「故障转移」。
 *   3. 分组图标与 rule-providers 统一走 jsDelivr CDN（避免 raw.githubusercontent.com 被墙）。
 *   4. external-controller 收紧到 127.0.0.1 + 强 secret；显式 mode: rule；DNS 增加冗余。
 *   5. 移除未被任何 rule 引用的 speedtest_domain 规则集（死配置）。
 */
const ICON = 'https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/';
const TEST_URL = 'https://www.gstatic.com/generate_204';
const EXCLUDE_FILTER = '(?i)(剩余|流量|到期|过期|重置|续费|套餐|官网|订阅|网址|购买|邀请|电报|群|t\\.me|traffic|expire|reset|renew)';
const DEFAULT_PROXIES = ['自动选择', '故障转移', '默认代理', 'DIRECT'];
const select = (name, icon) => ({name, type: 'select', 'include-all': true, proxies: [...DEFAULT_PROXIES], icon: ICON + icon});

function main(config) {
  config = config || {};

  Object.assign(config, {
    mode: 'rule',
    'mixed-port': 7890,
    'socks-port': 7891,
    'redir-port': 7892,
    port: 7893,
    'tproxy-port': 7894,
    'allow-lan': true,
    'bind-address': '*',
    ipv6: false,
    'unified-delay': true,
    'tcp-concurrent': true,
    'log-level': 'warning',
    'keep-alive-idle': 600,
    'keep-alive-interval': 15,
    'external-controller': '127.0.0.1:9090',
    secret: 'f4ae40b9db9b68d2f8bbea24434f97ef',
    profile: {
      'store-selected': true,
      'store-fake-ip': true
    },
    sniffer: {
      enable: true,
      'force-dns-mapping': false,
      'parse-pure-ip': true,
      sniff: {
        HTTP: {
          ports: [80, '8080-8880'],
          'override-destination': false
        },
        TLS: {
          ports: [443, 8443],
          'override-destination': false
        },
        QUIC: {
          ports: [443, 8443],
          'override-destination': false
        }
      },
      'skip-domain': ['Mijia Cloud', '+.push.apple.com', 'mtalk.google.com']
    },
    tun: {
      enable: true,
      stack: 'mixed',
      'dns-hijack': ['any:53', 'tcp://any:53']
    },
    dns: {
      enable: true,
      'cache-algorithm': 'arc',
      listen: '0.0.0.0:1053',
      ipv6: false,
      'respect-rules': true,
      'enhanced-mode': 'fake-ip',
      'fake-ip-range': '198.18.0.1/16',
      'fake-ip-filter-mode': 'blacklist',
      'direct-nameserver-follow-policy': true,
      'nameserver-policy': {
        'rule-set:googlefcm': ['https://8.8.8.8/dns-query#默认代理']
      },
      'default-nameserver': ['https://223.5.5.5/dns-query'],
      'proxy-server-nameserver': ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'],
      'direct-nameserver': ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'],
      nameserver: ['https://8.8.8.8/dns-query', 'https://1.1.1.1/dns-query'],
      'fake-ip-filter': ['+.push.apple.com', 'mtalk.google.com', 'rule-set:fakeipfilter_domain']
    },
    'proxy-groups': [
      {name: '默认代理', type: 'select', 'include-all': true, proxies: ['自动选择', '故障转移', 'DIRECT'], icon: ICON + 'Rocket.png'},
      {name: '自动选择', type: 'url-test', 'include-all': true, proxies: [], url: TEST_URL, interval: 300, tolerance: 50, lazy: true, 'exclude-filter': EXCLUDE_FILTER, icon: ICON + 'Auto.png'},
      {name: '故障转移', type: 'fallback', 'include-all': true, proxies: [], url: TEST_URL, interval: 300, lazy: true, 'exclude-filter': EXCLUDE_FILTER, icon: ICON + 'Round_Robin.png'},
      select('YouTube', 'YouTube.png'),
      select('Google', 'Google_Search.png'),
      select('GoogleFCM', 'Rocket.png'),
      select('ChatGPT', 'ChatGPT.png'),
      select('GitHub', 'GitHub.png'),
      select('OneDrive', 'OneDrive.png'),
      select('Microsoft', 'Microsoft.png'),
      select('TikTok', 'TikTok.png'),
      select('APPLE', 'Apple.png'),
      select('Telegram', 'Telegram.png'),
      select('NETFLIX', 'Netflix.png'),
      select('Disney', 'Disney%2B.png'),
      {name: '国内网络', type: 'select', 'include-all': true, proxies: ['DIRECT', '默认代理', '自动选择', '故障转移'], icon: ICON + 'China.png'},
      select('漏网之鱼', 'Final.png')
    ],
    rules: [
      'PROCESS-NAME,com.tencent.ig,默认代理',
      'RULE-SET,ziji,默认代理',
      'RULE-SET,private_ip,国内网络,no-resolve',
      'RULE-SET,private_domain,国内网络',
      'RULE-SET,cn_domain,国内网络',
      'RULE-SET,cn_ip,国内网络',
      'RULE-SET,zijign,国内网络',
      'RULE-SET,googlefcm,GoogleFCM',
      'RULE-SET,fakeipfilter_domain,国内网络',
      'RULE-SET,ai,ChatGPT',
      'RULE-SET,github_domain,GitHub',
      'RULE-SET,youtube_domain,YouTube',
      'RULE-SET,google_domain,Google',
      'RULE-SET,onedrive_domain,OneDrive',
      'RULE-SET,microsoft_domain,Microsoft',
      'RULE-SET,apple_domain,APPLE',
      'RULE-SET,tiktok_domain,TikTok',
      'RULE-SET,telegram_domain,Telegram',
      'RULE-SET,netflix_domain,NETFLIX',
      'RULE-SET,disney_domain,Disney',
      'RULE-SET,apple_ip,APPLE',
      'RULE-SET,google_ip,Google',
      'RULE-SET,netflix_ip,NETFLIX',
      'RULE-SET,telegram_ip,Telegram',
      'RULE-SET,proxylite,默认代理',
      'RULE-SET,geolocation-!cn,默认代理',
      'MATCH,漏网之鱼'
    ],
    'rule-providers': {
      ziji: {type: 'http', interval: 86400, behavior: 'domain', format: 'yaml', url: 'https://cdn.jsdelivr.net/gh/hheshenghuan-cloud/ziji@main/ziji.yaml'},
      zijign: {type: 'http', interval: 86400, behavior: 'domain', format: 'yaml', url: 'https://cdn.jsdelivr.net/gh/hheshenghuan-cloud/ziji@main/zijign.yaml'},
      googlefcm: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/googlefcm.mrs'},
      fakeipfilter_domain: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/DustinWin/ruleset_geodata@mihomo-ruleset/fakeip-filter.mrs'},
      private_domain: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/private.mrs'},
      proxylite: {type: 'http', interval: 86400, behavior: 'classical', format: 'text', url: 'https://cdn.jsdelivr.net/gh/qichiyuhub/rule@main/rules/proxy.list'},
      ai: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/category-ai-!cn.mrs'},
      youtube_domain: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/youtube.mrs'},
      google_domain: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/google.mrs'},
      github_domain: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/github.mrs'},
      telegram_domain: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/telegram.mrs'},
      netflix_domain: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/netflix.mrs'},
      onedrive_domain: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/onedrive.mrs'},
      microsoft_domain: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/microsoft.mrs'},
      apple_domain: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/apple.mrs'},
      tiktok_domain: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/tiktok.mrs'},
      'geolocation-!cn': {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/geolocation-!cn.mrs'},
      cn_domain: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/cn.mrs'},
      disney_domain: {type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/GitMetaio/rule@master/rule/Clash/Disney/Disney_OCD_Domain.mrs'},
      private_ip: {type: 'http', interval: 86400, behavior: 'ipcidr', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/private.mrs'},
      cn_ip: {type: 'http', interval: 86400, behavior: 'ipcidr', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/cn.mrs'},
      google_ip: {type: 'http', interval: 86400, behavior: 'ipcidr', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/google.mrs'},
      telegram_ip: {type: 'http', interval: 86400, behavior: 'ipcidr', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/telegram.mrs'},
      netflix_ip: {type: 'http', interval: 86400, behavior: 'ipcidr', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/netflix.mrs'},
      apple_ip: {type: 'http', interval: 86400, behavior: 'ipcidr', format: 'mrs', url: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo-lite/geoip/apple.mrs'}
    }
  });
  return config;
}
