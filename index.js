export default {
    async fetch(request, context) {
      return fetch("http://d1d21.ncdn.dns-site029.alicdn-test.com/v2/files/hello_er.txt", {
        {host:"d1d21.ncdn.dns-site029.alicdn-test.com"},
      });/*  */
    },
  };
