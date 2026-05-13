export default {
  async fetch(request, context, env) {
    const test_a = env.test_a;
    return new Response(`Get test_a: ${test_a} successfully!`);
  },
};
