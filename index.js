// ESA EdgeWorker 子请求脚本 - 直接返回固定文本
export default {
  async fetch(request, context, env) {
    return new Response("走two.anycast3.xxxtest.alicdn-test.com的ew2了！！！！", {
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  },
};
