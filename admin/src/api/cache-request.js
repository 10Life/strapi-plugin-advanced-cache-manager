import axiosInstance from '../utils/axiosInstance';
const sleep = ms => new Promise(res => setTimeout(res, ms));
const cachePurgeRequests = {
  short_cache: async () => {
    const data = await axiosInstance.get(`/advanced-cache-manager/short_cache`);
    await sleep(2000);
    return data;
  },
  purge_all: async () => {
    const data = await axiosInstance.get(`/advanced-cache-manager/purge_all`);
    await sleep(2000);
    return data;
  },
  purge_cdn: async () => {
    const data = await axiosInstance.get(`/advanced-cache-manager/purge_cdn`);
    await sleep(5000);
    return data;
  },
};
export default cachePurgeRequests;