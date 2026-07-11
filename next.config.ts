import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Fly Docker image.
  output: "standalone",
  experimental: {
    // Document uploads go through a Server Action, whose body defaults to 1 MB. Raise to match
    // the 15 MB backend cap (documents.service MAX_DOC_BYTES) so real documents aren't rejected
    // before reaching the backend.
    serverActions: { bodySizeLimit: "16mb" },
  },
};

export default nextConfig;
