// ESA EdgeWorker 子请求综合测试脚本
// 通过主请求自定义头 X-Test-Case 切换测试场景，部署一次即可覆盖所有用例
//
// 用法：curl -H 'X-Test-Case: <case>' 'http://域名/任意路径?_dyc=1' -x VIP:端口
//   404      → SPA 兜底（not_found_handling）
//   noetag   → If-None-Match ETag 不匹配 → 期望 200
//   etag     → If-None-Match ETag 匹配   → 期望 304
//   manual   → redirect: manual 不跟随重定向 → 期望 307
//   follow   → redirect: follow 跟随重定向   → 期望 200

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

    // ===== 404: Sec-Fetch-Mode: navigate 触发 SPA 兜底 =====
    if (testCase === "404") {
      const resp = await env.Assets.fetch("https://xxx.er.xxxtest.alicdn-test.com/notfound.html?_dyc=1", {
        headers: { "Sec-Fetch-Mode": "navigate" }
      });
      const text = await resp.text();
      const isEsaErrorPage = text.includes("error-page") || text.includes("__ESA_ERROR_PAGE_INFO");
      const isIndexHtml = !isEsaErrorPage && (text.includes("<!DOCTYPE") || text.includes("<html"));
      const respHeaders = headersToObj(resp.headers);
      const originInfo = getOriginInfo(resp.headers);
      console.log("[404] sub-request finalUrl:", resp.url, "originInfo:", JSON.stringify(originInfo));
      return new Response(JSON.stringify({
        test: "Sec-Fetch-Mode: navigate → SPA fallback",
        description: "子请求携带 Sec-Fetch-Mode: navigate 请求不存在的路径，验证是否触发 SPA 兜底返回 index.html",
        finalUrl: resp.url,
        originInfo,
        status: resp.status,
        headers: respHeaders,
        contentType: resp.headers.get("content-type"),
        isIndexHtml,
        isEsaErrorPage,
        body: text.substring(0, 500)
      }, null, 2), { headers: { "content-type": "application/json" } });
    }

    // ===== 404cors: Sec-Fetch-Mode: cors 触发 SPA 兜底 =====
    if (testCase === "404cors") {
      const resp = await env.Assets.fetch("http://xxx.er.xxxtest.alicdn-test.com/sub?_dyc=1", {
        headers: { "Sec-Fetch-Mode": "cors" }
      });
      const text = await resp.text();
      const isEsaErrorPage = text.includes("error-page") || text.includes("__ESA_ERROR_PAGE_INFO");
      const isIndexHtml = !isEsaErrorPage && (text.includes("<!DOCTYPE") || text.includes("<html"));
      const respHeaders = headersToObj(resp.headers);
      const originInfo = getOriginInfo(resp.headers);
      console.log("[404cors] sub-request finalUrl:", resp.url, "originInfo:", JSON.stringify(originInfo));
      return new Response(JSON.stringify({
        test: "Sec-Fetch-Mode: cors",
        description: "子请求携带 Sec-Fetch-Mode: cors 请求不存在的路径，验证是否触发 SPA 兜底返回 index.html",
        finalUrl: resp.url,
        originInfo,
        status: resp.status,
        headers: respHeaders,
        contentType: resp.headers.get("content-type"),
        isIndexHtml,
        isEsaErrorPage,
        body: text.substring(0, 500)
      }, null, 2), { headers: { "content-type": "application/json" } });
    }

    // ===== 404none: Sec-Fetch-Mode:  触发 SPA 兜底 =====
    if (testCase === "404none") {
      const resp = await env.Assets.fetch("http://xxx.er.xxxtest.alicdn-test.com/sub?_dyc=1", {
        headers: { "Sec-Fetch-Mode": "" }
      });
      const text = await resp.text();
      const isEsaErrorPage = text.includes("error-page") || text.includes("__ESA_ERROR_PAGE_INFO");
      const isIndexHtml = !isEsaErrorPage && (text.includes("<!DOCTYPE") || text.includes("<html"));
      const respHeaders = headersToObj(resp.headers);
      const originInfo = getOriginInfo(resp.headers);
      console.log("[404none] sub-request finalUrl:", resp.url, "originInfo:", JSON.stringify(originInfo));
      return new Response(JSON.stringify({
        test: "Sec-Fetch-Mode: 空 → SPA fallback",
        description: "子请求携带 Sec-Fetch-Mode: 空 请求不存在的路径，验证是否触发 SPA 兜底返回 index.html",
        finalUrl: resp.url,
        originInfo,
        status: resp.status,
        headers: respHeaders,
        contentType: resp.headers.get("content-type"),
        isIndexHtml,
        isEsaErrorPage,
        body: text.substring(0, 500)
      }, null, 2), { headers: { "content-type": "application/json" } });
    }

    // ===== noetag: If-None-Match ETag 不匹配 =====
    if (testCase === "noetag") {
      const resp = await env.Assets.fetch("http://xxx.er.xxxtest.alicdn-test.com/sub?_dyc=1", {
        headers: { "If-None-Match": '"fake-etag-wrong"' }
      });
      const text = await resp.text();
      const respHeaders = headersToObj(resp.headers);
      const originInfo = getOriginInfo(resp.headers);
      console.log("[noetag] sub-request finalUrl:", resp.url, "originInfo:", JSON.stringify(originInfo));
      return new Response(JSON.stringify({
        test: "If-None-Match ETag not match",
        description: "携带错误的 ETag，期望返回 200（不匹配，正常返回内容）",
        finalUrl: resp.url,
        originInfo,
        status: resp.status,
        headers: respHeaders,
        etag: resp.headers.get("etag"),
        contentType: resp.headers.get("content-type"),
        body: text.substring(0, 500)
      }, null, 2), { headers: { "content-type": "application/json" } });
    }

    // ===== etag: If-None-Match ETag 匹配 =====
    if (testCase === "etag") {
      const testUrl1 = "http://xxx.er.xxxtest.alicdn-test.com/abc?_dyc=1";
      const testUrl2 = "http://other.com/test.txt?_dyc=1";
      // 先 fetch 资源拿真实 ETag
      const r1 = await env.Assets.fetch(testUrl1);
      const realEtag = r1.headers.get("etag") || "";
      // 用真实 ETag 再次请求
      const r2 = await env.Assets.fetch(testUrl2, {
        headers: { "If-None-Match": realEtag }
      });
      const r2Headers = headersToObj(r2.headers);
      const r1Origin = getOriginInfo(r1.headers);
      const r2Origin = getOriginInfo(r2.headers);
      console.log("[etag] r1 finalUrl:", r1.url, "r1Origin:", JSON.stringify(r1Origin), "r2 finalUrl:", r2.url, "r2Origin:", JSON.stringify(r2Origin));
      return new Response(JSON.stringify({
        test: "If-None-Match ETag match",
        description: "先子请求获取真实 ETag，再用它发起请求，期望返回 304",
        r1FinalUrl: r1.url,
        r1OriginInfo: r1Origin,
        r2FinalUrl: r2.url,
        r2OriginInfo: r2Origin,
        realEtag: realEtag,
        status: r2.status,
        headers: r2Headers,
        contentType: r2.headers.get("content-type"),
        pass: r2.status === 304
      }, null, 2), { headers: { "content-type": "application/json" } });
    }

    // ===== manual: redirect manual 不跟随重定向 =====
    if (testCase === "manual") {
      const resp = await env.Assets.fetch("http://xxx.er.xxxtest.alicdn-test.com/sub?_dyc=1", {
        redirect: "manual"
      });
      const respHeaders = headersToObj(resp.headers);
      const originInfo = getOriginInfo(resp.headers);
      console.log("[manual] sub-request finalUrl:", resp.url, "originInfo:", JSON.stringify(originInfo));
      return new Response(JSON.stringify({
        test: "redirect: manual (do not follow)",
        description: "请求 .html 文件触发 clean URL 重定向，manual 模式应返回原始 307",
        finalUrl: resp.url,
        originInfo,
        status: resp.status,
        headers: respHeaders,
        location: resp.headers.get("location"),
        pass: resp.status === 307
      }, null, 2), { headers: { "content-type": "application/json" } });
    }

    // ===== follow: redirect follow 跟随重定向 =====
    if (testCase === "follow") {
      const resp = await env.Assets.fetch("http://xxx.er.xxxtest.alicdn-test.com/sub?_dyc=1", {
        redirect: "follow"
      });
      const text = await resp.text();
      const respHeaders = headersToObj(resp.headers);
      const originInfo = getOriginInfo(resp.headers);
      console.log("[follow] sub-request finalUrl:", resp.url, "originInfo:", JSON.stringify(originInfo));
      return new Response(JSON.stringify({
        test: "redirect: follow (follow redirect)",
        description: "请求 .html 文件触发 clean URL 重定向，follow 模式应跟随并返回 200",
        finalUrl: resp.url,
        originInfo,
        status: resp.status,
        headers: respHeaders,
        contentType: resp.headers.get("content-type"),
        body: text.substring(0, 500),
        pass: resp.status === 200
      }, null, 2), { headers: { "content-type": "application/json" } });
    }

    // ===== default: 未匹配到任何测试场景 =====
    return new Response(JSON.stringify({
      test: "unknown or missing X-Test-Case",
      description: "请在 curl 中通过 -H 'X-Test-Case: <case>' 指定测试场景",
      availableCases: ["404", "noetag", "etag", "manual", "follow"],
      received: testCase
    }, null, 2), { headers: { "content-type": "application/json" } });
  },
};
