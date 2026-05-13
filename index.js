export default {
  async fetch(request, context, env) {
    const TESAT_B = env.TESAT_B;

    return new Response(`Get TEST_KEY_PLAIN: ${TESAT_B} successfully!`);
  },
};
