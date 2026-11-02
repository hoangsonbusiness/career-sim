// SPEC-003 R-12: xuất tĩnh ra out/, mỗi trang là một index.html.
/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
