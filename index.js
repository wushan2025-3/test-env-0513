export default {
  async fetch(request, context, env) {
    const TEST_KEY_PLAIN = env.test_a;
    return new Response(`Get TEST_KEY_PLAIN: ${TEST_KEY_PLAIN} successfully!`);
  },
};
