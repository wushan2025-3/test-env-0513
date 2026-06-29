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
  async fetch(request, env) {
    return handleAssetsFetch(request, env);
  }
};
