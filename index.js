// ESA EdgeWorker 最简子请求测试脚本
// 直接 fetch 主请求 URL，无需任何自定义头或参数

function headersToObj(headers) {
  const obj = {};
  for (const [k, v] of headers.entries()) obj[k] = v;
  return obj;
}

export default {
  async fetch(request, context, env) {
    const resp = await fetch(request.url);
    const text = await resp.text();
    const respHeaders = headersToObj(resp.headers);

    console.log("[sub] url:", request.url, "finalUrl:", resp.url);

    return new Response(JSON.stringify({
      requestUrl: request.url,
      finalUrl: resp.url,
      status: resp.status,
      headers: respHeaders,
      body: text.substring(0, 500)
    }, null, 2), { headers: { "content-type": "application/json" } });
  },
};
