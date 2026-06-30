// 1.1.1.1 主请求 fetch 本ESA域名 - Sec-Fetch-Mode: navigate 头透传验证
export default {
  async fetch(request, context, env) {
    const url = new URL(request.url);

    // 构造指向本ESA域名的子请求
    const subUrl = `${url.protocol}//${url.host}/test.txt`;

    try {
      const resp = await env.Assets.fetch(subUrl, {
        headers: {
          "Sec-Fetch-Mode": "navigate",
        },
      });
      const body = await resp.text();
      return new Response(JSON.stringify({
        test: "1.1.1.1 Sec-Fetch-Mode: navigate 透传",
        subRequestUrl: subUrl,
        status: resp.status,
        contentType: resp.headers.get("content-type"),
        body: body.substring(0, 500),
        success: true,
      }, null, 2), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({
        test: "1.1.1.1 Sec-Fetch-Mode: navigate 透传",
        error: e.message,
        success: false,
      }, null, 2), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
