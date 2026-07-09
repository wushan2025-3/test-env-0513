// ESA EdgeWorker fetch host 覆盖测试脚本
// 通过主请求自定义头 X-Test-Case 切换测试场景，部署一次即可覆盖所有用例
//
// 用法：curl -H 'X-Test-Case: <case>' 'http://域名/任意路径?_dyc=1' -x VIP:端口
//   http_3rd_origin1_esa2  → fetch http://testcdn.1.alicdn-test.com + host: other.er.xxxtest.alicdn-test.com

function headersToObj(headers) {
  const obj = {};
  for (const [k, v] of headers.entries()) obj[k] = v;
  return obj;
}

// 从响应头提取实际回源信息
function getOriginInfo(headers) {
  const info = {
    originHost: null,
    originScheme: null,
    originPath: null
  };

  // 1. 从 x-site-origin-log-info 提取回源域名和协议
  // 格式: "2||none||22||-1||61||-||304||cdn-edgejs.oss-cn-hangzhou.aliyuncs.com||39.173.43.137:80||..."
  const originLog = headers.get("x-site-origin-log-info");
  if (originLog) {
    const parts = originLog.split("||");
    if (parts.length >= 8) info.originHost = parts[7] || null;
  }

  // 2. 从 dyconf-site-cache-key 提取实际 OSS 资源路径
  // 格式: "http://sp-rwa-oss.aliyun-esa.com-alicdnsite-xxx/sp_esa_rwa/.../assets/404.html"
  const cacheKey = headers.get("dyconf-site-cache-key");
  if (cacheKey) {
    // 取最后一个 /assets/ 之后的路径
    const assetsIdx = cacheKey.lastIndexOf("/assets/");
    if (assetsIdx !== -1) info.originPath = cacheKey.substring(assetsIdx);
    // 提取协议
    info.originScheme = cacheKey.startsWith("https://") ? "https" : "http";
  }

  // 3. 兼容 x-debug-dprs-* 头（主请求路径）
  if (!info.originHost) info.originHost = headers.get("x-debug-dprs-origin-host") || null;
  if (!info.originScheme) info.originScheme = headers.get("x-debug-dprs-origin-scheme") || null;
  if (!info.originPath) {
    const canonical = headers.get("x-debug-dprs-oss-canonical-request");
    if (canonical) {
      try {
        const decoded = atob(canonical);
        const lines = decoded.split("\n");
        if (lines.length >= 2) info.originPath = lines[1].trim();
      } catch (e) { /* ignore */ }
    }
  }

  return info;
}

export default {
  async fetch(request, context, env) {
    const testCase = request.headers.get("X-Test-Case") || "default";



    // ===== http第三方域名源站1+esa域名2: fetch http 第三方域名 + host 覆盖 =====
    if (testCase === "http_3rd_origin1_esa2") {
      const subUrl = "http://other.er.xxxtest.alicdn-test.com/v2/files/hello_er.txt";
      const overrideHost = "realcert.alicdn-test.com";
      const resp = await fetch(subUrl, {
        host: overrideHost
      });
      const text = await resp.text();
      const respHeaders = headersToObj(resp.headers);
      const originInfo = getOriginInfo(resp.headers);
      console.log("[http_3rd_origin1_esa2] subUrl:", subUrl, "host:", overrideHost, "finalUrl:", resp.url, "originInfo:", JSON.stringify(originInfo));
      return new Response(JSON.stringify({
        test: "http_3rd_origin1_esa2",
        description: "子请求 http://testcdn.1.alicdn-test.com/v2/files/hello_er.txt + host: other.er.xxxtest.alicdn-test.com",
        subRequestUrl: subUrl,
        hostOverride: overrideHost,
        finalUrl: resp.url,
        originInfo,
        status: resp.status,
        headers: respHeaders,
        body: text.substring(0, 500)
      }, null, 2), { headers: { "content-type": "application/json" } });
    }

    // ===== https第三方域名源站1+esa域名2: fetch https 第三方域名 + host 覆盖 =====
    if (testCase === "https_3rd_origin1_esa2") {
      const subUrl = "https://testcdn.1.alicdn-test.com/v2/files/hello_er.txt";
      const overrideHost = "other.er.xxxtest.alicdn-test.com";
      const resp = await fetch(subUrl, {
        host: overrideHost
      });
      const text = await resp.text();
      const respHeaders = headersToObj(resp.headers);
      const originInfo = getOriginInfo(resp.headers);
      console.log("[http_3rd_origin1_esa2] subUrl:", subUrl, "host:", overrideHost, "finalUrl:", resp.url, "originInfo:", JSON.stringify(originInfo));
      return new Response(JSON.stringify({
        test: "http_3rd_origin1_esa2",
        description: "子请求 https://testcdn.1.alicdn-test.com/v2/files/hello_er.txt + host: other.er.xxxtest.alicdn-test.com",
        subRequestUrl: subUrl,
        hostOverride: overrideHost,
        finalUrl: resp.url,
        originInfo,
        status: resp.status,
        headers: respHeaders,
        body: text.substring(0, 500)
      }, null, 2), { headers: { "content-type": "application/json" } });
    }


    

    // ===== default: 未匹配到任何测试场景 =====
    return new Response(JSON.stringify({
      test: "unknown or missing X-Test-Case",
      description: "请在 curl 中通过 -H 'X-Test-Case: <case>' 指定测试场景",
      availableCases: ["http_3rd_origin1_esa2"],
      received: testCase
    }, null, 2), { headers: { "content-type": "application/json" } });
  },
};
