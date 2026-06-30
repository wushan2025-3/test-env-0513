// 1.1.1.1 主请求fetch本ESA域名 - Sec-Fetch-Mode: navigate 头透传验证
export default {
  async fetch(request, context, env) {
    const url = new URL(request.url);
    const subUrl = `${url.protocol}//${url.host}/test.txt`;

    try {
      const resp = await env.Assets.fetch(subUrl, {
        headers: {
          "Sec-Fetch-Mode": "navigate",
        },
      });
      const text = await resp.text();
      return new Response(JSON.stringify({
        test: "Sec-Fetch-Mode: navigate 透传验证",
        description: "子请求携带 Sec-Fetch-Mode: navigate 头，验证是否透传到源站",
        subRequestUrl: subUrl,
        status: resp.status,
        contentType: resp.headers.get("content-type"),
        body: text.substring(0, 500)
      }, null, 2), { headers: { "content-type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({
        test: "Sec-Fetch-Mode: navigate 透传验证",
        error: e.message,
        success: false,
      }, null, 2), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  },
};
