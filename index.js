export default {
  async fetch(request, context) {
    const { env } = await import("alibaba:workers");
    const TESAT_B = env.TESAT_B;

    return new Response(`Get TESAT_B: ${TESAT_B}  successfully!`);
  },
};
