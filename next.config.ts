import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Same-topic duplicate articles were merged into one (two pages on one topic compete with each
     other in search). Each removed article redirects permanently to the one that was kept. */
  async redirects() {
    return [
      { source: '/blogs/backflow-testing-certification-tracking-irrigation-business-software', destination: '/blogs/backflow-testing-certification-tracking-irrigation-software', permanent: true },
      { source: '/blogs/job-board-unassigned-repairs-irrigation-business-software', destination: '/blogs/job-board-unassigned-work-irrigation-software', permanent: true },
      { source: '/blogs/roi-payback-irrigation-business-software', destination: '/blogs/roi-of-irrigation-software-for-contractors', permanent: true },
      { source: '/blogs/new-system-install-bids-irrigation-business-software', destination: '/blogs/line-item-bids-installs-irrigation-software', permanent: true },
      { source: '/blogs/sprinkler-repair-estimates-irrigation-estimating-software', destination: '/blogs/line-item-repair-estimates-sprinkler-repair-software', permanent: true },
      { source: '/blogs/all-in-one-vs-patchwork-sprinkler-repair-software', destination: '/blogs/all-in-one-irrigation-crew-dispatch-software-vs-patchwork', permanent: true },
    ];
  },
};

export default nextConfig;
