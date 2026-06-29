const html = `<!DOCTYPE html>
<body>
  <h1>Hello World测试的E11R8888</h1>
</body>`

async function handleRequest(request) {
  return new Response(html, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  })
}

async function handleAssetsFetch(request, env) {
  return await env.Assets.fetch("http://xxx.er.xxxtest.alicdn-test.com/test.txt");
}

export default {
  async fetch(request, context, env) {
    const url = "http://any-host.com/style.css";

    try {
      const resp = await env.Assets.fetch(url, {
        headers: {
          "If-None-Match": '"init-etag-456"',
          "Sec-Fetch-Mode": "no-cors",
          "X-Forbidden-Header": "should-not-pass",
          "Cookie": "session=abc; should-not-pass",
        },
      });
      const body = await resp.text();
      return new Response(JSON.stringify({
        status: resp.status,
        success: true,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({
        error: e.message,
        success: false,
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
