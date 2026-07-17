// ESA EdgeWorker 最简子请求测试脚本
// 用法：curl 'http://域名/er.js?_dyc=1&subUrl=<子请求URL>&host=<覆盖host>' -x VIP:PORT

function headersToObj(headers) {
  const obj = {};
  for (const [k, v] of headers.entries()) obj[k] = v;
  return obj;
}

export default {
  async fetch(request, context, env) {
    const url = new URL(request.url);
    const subUrl = url.searchParams.get("subUrl") || "http://other.er.xxxtest.alicdn-test.com/v2/files/hello_er.txt";
    const overrideHost = url.searchParams.get("host") || "xxx.er.xxxtest.alicdn-test.com";

    const fetchOpts = { redirect: "manual" };
    if (overrideHost) fetchOpts.host = overrideHost;
    const resp = await fetch(subUrl, fetchOpts);
    const text = await resp.text();
    const respHeaders = headersToObj(resp.headers);

    console.log("[sub] subUrl:", subUrl, "host:", overrideHost, "finalUrl:", resp.url);

    return new Response(JSON.stringify({
      subUrl,
      hostOverride: overrideHost,
      finalUrl: resp.url,
      status: resp.status,
      headers: respHeaders,
      body: text.substring(0, 500) + "走子请求的ew2了！！！！"
    }, null, 2), { headers: { "content-type": "application/json" } });
  },
};
